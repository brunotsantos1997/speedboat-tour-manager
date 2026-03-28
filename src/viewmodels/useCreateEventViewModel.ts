// src/viewmodels/useCreateEventViewModel.ts
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { DayOfWeek, Product, Discount, SelectedProduct, ClientProfile, Boat, EventType, PaymentStatus, CompanyData } from '../core/domain/types';
import { clientRepository } from '../core/repositories/ClientRepository';
import { productRepository } from '../core/repositories/ProductRepository';
import { boatRepository } from '../core/repositories/BoatRepository';
import { tourTypeRepository } from '../core/repositories/TourTypeRepository';
import { eventRepository } from '../core/repositories/EventRepository';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';
import { format } from 'date-fns';
import { timeToMinutes, minutesToTime } from '../core/utils/timeUtils';
import type { BoardingLocation, TourType } from '../core/domain/types';
import { boardingLocationRepository } from '../core/repositories/BoardingLocationRepository';
import { sanitizeObject } from '../core/utils/objectUtils';
import { useEventSync } from './useEventSync';
import { useModalContext } from '../ui/contexts/ModalContext';

export const useCreateEventViewModel = () => {
  const { currentUser } = useAuth();
  const { syncEvent } = useEventSync();
  const { confirm } = useModalContext();
  const [searchParams] = useSearchParams();
  const [editingEventId, setEditingEventId] = useState<string | null>(searchParams.get('eventId'));
  const [originalEvent, setOriginalEvent] = useState<EventType | null>(null);
  const [originalPaymentStatus, setOriginalPaymentStatus] = useState<PaymentStatus | undefined>(undefined);

  // Event State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [scheduledEvents, setScheduledEvents] = useState<EventType[]>([]);
  const [isPreScheduled, setIsPreScheduled] = useState(true);

  // Boat State
  const [availableBoats, setAvailableBoats] = useState<Boat[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);

  // Boarding Location State
  const [availableBoardingLocations, setAvailableBoardingLocations] = useState<BoardingLocation[]>([]);
  const [selectedBoardingLocation, setSelectedBoardingLocation] = useState<BoardingLocation | null>(null);

  // Tour Type State
  const [availableTourTypes, setAvailableTourTypes] = useState<TourType[]>([]);
  const [selectedTourType, setSelectedTourType] = useState<TourType | null>(null);

  // Core State
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [rentalDiscount, setRentalDiscount] = useState<Discount>({ type: 'FIXED', value: 0 });
  const [passengerCount, setPassengerCount] = useState(1);
  const [observations, setObservations] = useState('');
  const [tax, setTax] = useState(0);
  const [taxDescription, setTaxDescription] = useState('');

  // Client Management State
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<ClientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loyaltySuggestion] = useState<string | null>(null);

  // New Client Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Company Data
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  // --- Helpers ---
  const dayOfWeek = useMemo(() => {
    if (!selectedDate) return null;
    return format(selectedDate, 'EEEE').toLowerCase() as DayOfWeek;
  }, [selectedDate]);

  const isBusinessClosed = useMemo(() => {
    if (!companyData?.businessHours || !dayOfWeek) return true;
    const dayConfig = companyData.businessHours[dayOfWeek];
    return dayConfig.isClosed || !dayConfig.startTime || !dayConfig.endTime;
  }, [companyData, dayOfWeek]);

  const availableTimeSlots = useMemo(() => {
    const allDaySlots = Array.from({ length: 1440 }, (_, i) => minutesToTime(i));
    if (!companyData || isBusinessClosed || !dayOfWeek) return [];
    const { startTime: businessStartTime, endTime: businessEndTime } = companyData.businessHours[dayOfWeek];
    const businessStartMin = timeToMinutes(businessStartTime);
    let businessEndMin = timeToMinutes(businessEndTime);

    // If end time is 00:00 and it's not closed, it likely means end of day (24h)
    if (businessEndMin === 0 && businessStartMin === 0) {
      businessEndMin = 1440;
    } else if (businessEndMin <= businessStartMin) {
      // Handle cases where end time is on the next day or meant to be 24h
      businessEndMin = 1440;
    }

    const validSlots = allDaySlots.filter(slot => {
      const min = timeToMinutes(slot);
      return min >= businessStartMin && min <= (businessEndMin - 30);
    });
    if (!selectedBoat) return validSlots;
    const orgTime = selectedBoat.organizationTimeMinutes || 0;
    const otherBoatEvents = scheduledEvents.filter(event => event.boat?.id === selectedBoat.id && event.id !== editingEventId);
    return validSlots.filter(slot => {
      const slotMin = timeToMinutes(slot);
      const slotEndMin = slotMin + 30;
      return !otherBoatEvents.some(event => {
        const eventStartMin = timeToMinutes(event.startTime);
        const eventEndMin = timeToMinutes(event.endTime);
        const isBefore = slotEndMin <= (eventStartMin - 2 * orgTime);
        const isAfter = slotMin >= (eventEndMin + 2 * orgTime);
        return !isBefore && !isAfter;
      });
    });
  }, [scheduledEvents, selectedBoat, editingEventId, companyData, dayOfWeek, isBusinessClosed]);

  const availableEndTimeSlots = useMemo(() => {
    if (!startTime || !selectedBoat || !selectedDate) return [];
    const startDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${startTime}:00`).getTime();
    const orgTimeMs = (selectedBoat.organizationTimeMinutes || 0) * 60 * 1000;
    const options: { time: string, date: Date }[] = [];
    for (let n = 1; n <= 48; n++) {
      const currentDateTime = new Date(startDateTime + (n * 30 * 60 * 1000));
      const endTimeStr = format(currentDateTime, 'HH:mm');
      const hasConflict = scheduledEvents
        .filter(event => event.boat?.id === selectedBoat.id && event.id !== editingEventId)
        .some(event => {
          const eventStartDateTime = new Date(`${event.date}T${event.startTime}:00`).getTime();
          const eventEndDateTime = new Date(`${event.endDate}T${event.endTime}:00`).getTime();
          return (startDateTime - orgTimeMs) < (eventEndDateTime + orgTimeMs) && (currentDateTime.getTime() + orgTimeMs) > (eventStartDateTime - orgTimeMs);
        });
      if (hasConflict) break;
      options.push({ time: endTimeStr, date: currentDateTime });
    }
    return options;
  }, [startTime, selectedDate, scheduledEvents, selectedBoat, editingEventId]);

  // Unified Data Loading
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        let initialEvent: EventType | null = null;
        if (editingEventId) {
          const event = await eventRepository.getById(editingEventId);
          if (event) {
            initialEvent = event;
            setOriginalEvent(event);
            setOriginalPaymentStatus(event.paymentStatus);
          } else {
            setEditingEventId(null);
          }
        } else {
          setOriginalEvent(null);
        }

        const [products, boats, boardingLocations, tourTypes, companyDataResponse] = await Promise.all([
          productRepository.getAll(),
          boatRepository.getAll(),
          boardingLocationRepository.getAll(),
          tourTypeRepository.getAll(),
          CompanyDataRepository.getInstance().get()
        ]);

        if (companyDataResponse) setCompanyData(companyDataResponse);
        setAvailableProducts(products);
        setAvailableBoats(boats);
        setAvailableBoardingLocations(boardingLocations);
        setAvailableTourTypes(tourTypes);

        if (initialEvent) {
          const eventDate = new Date(initialEvent.date);
          const eventEndDate = new Date(initialEvent.endDate || initialEvent.date);
          const userTimezoneOffset = eventDate.getTimezoneOffset() * 60000;
          setSelectedDate(new Date(eventDate.getTime() + userTimezoneOffset));
          setEndDate(new Date(eventEndDate.getTime() + userTimezoneOffset));
          setStartTime(initialEvent.startTime);
          setEndTime(initialEvent.endTime);
          setSelectedBoat(initialEvent.boat);
          setSelectedBoardingLocation(initialEvent.boardingLocation);
          setSelectedTourType(initialEvent.tourType || null);
          setSelectedProducts(initialEvent.products);
          setRentalDiscount(initialEvent.rentalDiscount || { type: 'FIXED', value: 0 });
          setPassengerCount(initialEvent.passengerCount);
          setSelectedClient(initialEvent.client);
          setClientSearchTerm(initialEvent.client.name);
          setObservations(initialEvent.observations || '');
          setIsPreScheduled(initialEvent.status === 'PRE_SCHEDULED');
          setTax(initialEvent.tax || 0);
          setTaxDescription(initialEvent.taxDescription || '');
        } else {
          if (boats.length > 0) setSelectedBoat(boats[0]);
          if (boardingLocations.length > 0) setSelectedBoardingLocation(boardingLocations[0]);
          if (tourTypes.length > 0) {
            const defaultTourType = tourTypes.find(t => t.name.toLowerCase() === 'passeio') || tourTypes[0];
            setSelectedTourType(defaultTourType);
          }
          const defaultCourtesies = products
            .filter(p => p.isDefaultCourtesy)
            .map(p => ({ ...p, isCourtesy: true }));
          setSelectedProducts(defaultCourtesies);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadAllData();
  }, [editingEventId]);

  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      eventRepository.getEventsByDate(dateString).then(setScheduledEvents);
    }
  }, [selectedDate]);

  // Handlers
  const toggleProduct = useCallback((product: Product) => {
    setSelectedProducts(prev =>
      prev.some(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, {
            ...product,
            isCourtesy: false,
            startTime: product.pricingType === 'HOURLY' ? startTime : undefined,
            endTime: product.pricingType === 'HOURLY' ? endTime : undefined
          }]
    );
  }, [startTime, endTime]);

  const toggleCourtesy = useCallback((productId: string) => {
    setSelectedProducts(prev => prev.map(p => p.id === productId ? { ...p, isCourtesy: !p.isCourtesy } : p));
  }, []);

  const updateProductDiscount = useCallback((productId: string, discount: Discount) => {
    setSelectedProducts(prev => prev.map(p => p.id === productId ? { ...p, discount } : p));
  }, []);

  const updateDiscountType = useCallback((type: 'FIXED' | 'PERCENTAGE', category: 'rental') => {
    if (category === 'rental') setRentalDiscount(prev => ({ ...prev, type }));
  }, []);

  const updateDiscountValue = useCallback((value: number, category: 'rental') => {
    const val = isNaN(value) || value < 0 ? 0 : value;
    if (category === 'rental') setRentalDiscount(prev => ({ ...prev, value: val }));
  }, []);

  const updatePassengerCount = useCallback((count: number) => {
    const newCount = Math.max(1, count);
    if (!isNaN(newCount)) setPassengerCount(newCount);
  }, []);

  const updateTax = useCallback((value: number) => setTax(isNaN(value) || value < 0 ? 0 : value), []);
  const updateTaxDescription = useCallback((desc: string) => setTaxDescription(desc), []);

  const handleBoatSelection = useCallback((boatId: string) => {
    const boat = availableBoats.find(b => b.id === boatId);
    setSelectedBoat(boat || null);
  }, [availableBoats]);

  const handleBoardingLocationSelection = useCallback((locationId: string) => {
    const location = availableBoardingLocations.find(l => l.id === locationId);
    setSelectedBoardingLocation(location || null);
  }, [availableBoardingLocations]);

  const handleTourTypeSelection = useCallback((tourTypeId: string) => {
    const tourType = availableTourTypes.find(t => t.id === tourTypeId);
    setSelectedTourType(tourType || null);
  }, [availableTourTypes]);

  const handleSaveTourType = useCallback(async (name: string, color: string) => {
    const newTourType = await tourTypeRepository.add({ name, color, isArchived: false });
    const tourTypes = await tourTypeRepository.getAll();
    setAvailableTourTypes(tourTypes);
    setSelectedTourType(newTourType);
  }, []);

  const updateHourlyProductTime = useCallback((productId: string, time: string, type: 'start' | 'end') => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p.id === productId && p.pricingType === 'HOURLY') {
          return {
            ...p,
            startTime: type === 'start' ? time : p.startTime,
            endTime: type === 'end' ? time : p.endTime,
          };
        }
        return p;
      })
    );
  }, []);

  const updateEndDateFromTime = useCallback((time: string) => {
    const selectedOption = availableEndTimeSlots.find(opt => opt.time === time);
    if (selectedOption) {
      setEndTime(time);
      setEndDate(selectedOption.date);
    }
  }, [availableEndTimeSlots]);

  const handleClientSearch = useCallback(async (term: string) => {
    setClientSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      try {
        const results = await clientRepository.search(term);
        setClientSearchResults(results);
      } catch (error) {
        console.error('Erro na busca de clientes:', error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setClientSearchResults([]);
    }
  }, []);

  const selectClient = useCallback((client: ClientProfile) => {
    setSelectedClient(client);
    setClientSearchTerm(client.name);
    setClientSearchResults([]);
  }, []);

  const clearClientSelection = useCallback(() => {
    setSelectedClient(null);
    setClientSearchTerm('');
  }, []);

  const handleOpenModal = (client: ClientProfile | null = null) => {
    if (client) {
      setEditingClient(client);
      setNewClientName(client.name);
      setNewClientPhone(client.phone);
    } else {
      setEditingClient(null);
      const isPhone = /^\d+$/.test(clientSearchTerm);
      setNewClientName(isPhone ? '' : clientSearchTerm);
      setNewClientPhone(isPhone ? clientSearchTerm : '');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setNewClientName('');
    setNewClientPhone('');
  };

  const handleSaveClient = useCallback(async () => {
    if (!newClientName || !newClientPhone) return;
    try {
      if (editingClient) {
        const updatedClient = { ...editingClient, name: newClientName, phone: newClientPhone };
        const result = await clientRepository.update(updatedClient);
        if (selectedClient?.id === result.id) {
          setSelectedClient(result);
          setClientSearchTerm(result.name);
        }
      } else {
        const newClient = await clientRepository.add({ name: newClientName, phone: newClientPhone });
        selectClient(newClient);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      throw error;
    }
  }, [editingClient, newClientName, newClientPhone, selectedClient, handleCloseModal, selectClient]);

  const handleDeleteClient = useCallback(async (clientId: string) => {
    if (await confirm('Confirmar Exclusão', 'Tem certeza que deseja excluir este cliente?')) {
      await clientRepository.delete(clientId);
      if (selectedClient?.id === clientId) clearClientSelection();
      handleClientSearch(clientSearchTerm);
    }
  }, [selectedClient, clientSearchTerm, handleClientSearch, clearClientSelection, confirm]);

  // Calculations
  const isCapacityExceeded = useMemo(() => {
    if (!selectedBoat) return false;
    return passengerCount > selectedBoat.capacity;
  }, [passengerCount, selectedBoat]);

  const boatRentalCost = useMemo(() => {
    if (!selectedBoat || !startTime || !endTime || !selectedDate || !endDate) return 0;
    const startDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${startTime}:00`).getTime();
    const endDateTime = new Date(`${format(endDate, 'yyyy-MM-dd')}T${endTime}:00`).getTime();
    const durationInMinutes = (endDateTime - startDateTime) / (60 * 1000);
    if (durationInMinutes <= 0) return 0;
    const hours = Math.floor(durationInMinutes / 60);
    const remainingMinutes = durationInMinutes % 60;
    let cost = hours * (selectedBoat.pricePerHour || 0);
    if (remainingMinutes >= 30) cost += (selectedBoat.pricePerHalfHour || 0);
    return cost;
  }, [startTime, endTime, selectedBoat, selectedDate, endDate]);

  const productsCost = useMemo(() => {
    return selectedProducts.reduce((acc, product) => {
      if (product.isCourtesy) return acc;
      switch (product.pricingType) {
        case 'PER_PERSON': return acc + (product.price || 0) * passengerCount;
        case 'HOURLY':
          if (product.startTime && product.endTime && product.hourlyPrice) {
            const startMin = timeToMinutes(product.startTime);
            const endMin = timeToMinutes(product.endTime);
            const durationInHours = (endMin - startMin) / 60;
            if (durationInHours > 0) return acc + durationInHours * product.hourlyPrice;
          }
          return acc;
        case 'FIXED':
        default: return acc + (product.price || 0);
      }
    }, 0);
  }, [selectedProducts, passengerCount]);

  const subtotal = useMemo(() => productsCost + boatRentalCost, [productsCost, boatRentalCost]);

  const rentalDiscountValue = useMemo(() => {
    if (rentalDiscount.type === 'FIXED') return rentalDiscount.value;
    return boatRentalCost * (rentalDiscount.value / 100);
  }, [boatRentalCost, rentalDiscount]);

  const totalDiscount = useMemo(() => {
    const productDiscountsTotal = selectedProducts.reduce((acc, p) => {
      if (p.isCourtesy || !p.discount || p.discount.value <= 0) return acc;
      let itemGross = 0;
      if (p.pricingType === 'PER_PERSON') itemGross = (p.price || 0) * passengerCount;
      else if (p.pricingType === 'HOURLY' && p.startTime && p.endTime && p.hourlyPrice) {
           const duration = (timeToMinutes(p.endTime) - timeToMinutes(p.startTime)) / 60;
           itemGross = duration > 0 ? duration * p.hourlyPrice : 0;
      } else itemGross = p.price || 0;
      if (p.discount.type === 'FIXED') return acc + p.discount.value;
      return acc + (itemGross * (p.discount.value / 100));
    }, 0);
    return rentalDiscountValue + productDiscountsTotal;
  }, [rentalDiscountValue, selectedProducts, passengerCount]);

  const total = useMemo(() => Math.max(0, subtotal - totalDiscount + tax), [subtotal, totalDiscount, tax]);

  const createEvent = useCallback(async () => {
    if (!selectedDate || !selectedClient || !selectedBoat || !selectedBoardingLocation || !selectedTourType || !endDate) {
      throw new Error('Campos obrigatórios ausentes.');
    }
    const productDiscountsTotal = selectedProducts.reduce((acc, p) => {
        if (p.isCourtesy || !p.discount || p.discount.value <= 0) return acc;
        let itemGross = 0;
        if (p.pricingType === 'PER_PERSON') itemGross = (p.price || 0) * passengerCount;
        else if (p.pricingType === 'HOURLY' && p.startTime && p.endTime && p.hourlyPrice) {
             const duration = (timeToMinutes(p.endTime) - timeToMinutes(p.startTime)) / 60;
             itemGross = duration > 0 ? duration * p.hourlyPrice : 0;
        } else itemGross = p.price || 0;
        if (p.discount.type === 'FIXED') return acc + p.discount.value;
        return acc + (itemGross * (p.discount.value / 100));
    }, 0);
    const productsRevenue = productsCost - productDiscountsTotal;
    const rentalRevenue = boatRentalCost - rentalDiscountValue;
    let rentalCost = 0;
    if (selectedBoat && startTime && endTime && selectedDate && endDate) {
        const startDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${startTime}:00`).getTime();
        const endDateTime = new Date(`${format(endDate, 'yyyy-MM-dd')}T${endTime}:00`).getTime();
        const durationInMinutes = (endDateTime - startDateTime) / (60 * 1000);
        if (durationInMinutes > 0) {
            const hours = Math.floor(durationInMinutes / 60);
            const remainingMinutes = durationInMinutes % 60;
            rentalCost = hours * (selectedBoat.costPerHour || 0);
            if (remainingMinutes >= 30) rentalCost += (selectedBoat.costPerHalfHour || 0);
        }
    }
    const productsCostValue = selectedProducts.reduce((acc, p) => {
      if (p.isCourtesy) return acc;
      if (p.pricingType === 'PER_PERSON') return acc + (p.cost || 0) * passengerCount;
      if (p.pricingType === 'HOURLY' && p.startTime && p.endTime && p.hourlyCost) {
        const d = (timeToMinutes(p.endTime) - timeToMinutes(p.startTime)) / 60;
        return acc + (d > 0 ? d * p.hourlyCost : 0);
      }
      return acc + (p.cost || 0);
    }, 0);
    const eventStatus = isPreScheduled ? 'PRE_SCHEDULED' : 'SCHEDULED';
    const eventData: any = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      startTime,
      endTime,
      status: eventStatus as EventType['status'],
      paymentStatus: (editingEventId && originalPaymentStatus === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING') as PaymentStatus,
      boat: selectedBoat,
      boardingLocation: selectedBoardingLocation,
      tourType: selectedTourType,
      products: selectedProducts.map(p => ({ ...p, snapshotCost: p.cost })),
      rentalDiscount,
      discount: { type: 'FIXED', value: 0 },
      productsDiscount: { type: 'FIXED', value: 0 },
      client: selectedClient,
      passengerCount,
      subtotal,
      total,
      tax: tax || 0,
      taxDescription,
      observations,
      rentalRevenue,
      productsRevenue,
      rentalGross: boatRentalCost,
      productsGross: productsCost,
      rentalCost,
      productsCost: productsCostValue,
      taxCost: originalEvent?.taxCost || 0,
      additionalCosts: originalEvent?.additionalCosts || [],
    };
    if (isPreScheduled) eventData.preScheduledAt = originalEvent?.preScheduledAt || Date.now();
    let savedEvent: EventType;
    if (editingEventId) {
      const updatedEvent = sanitizeObject({ ...eventData, id: editingEventId, createdByUserId: originalEvent?.createdByUserId }) as EventType;
      savedEvent = await eventRepository.updateEvent(updatedEvent);
    } else {
      const newEventData = sanitizeObject({ ...eventData, createdByUserId: currentUser?.id }) as Omit<EventType, 'id'>;
      savedEvent = await eventRepository.add(newEventData);
    }
    await syncEvent(savedEvent);
    return selectedClient;
  }, [selectedDate, endDate, startTime, endTime, selectedBoat, selectedBoardingLocation, selectedTourType, selectedProducts, rentalDiscount, passengerCount, boatRentalCost, productsCost, subtotal, rentalDiscountValue, total, tax, taxDescription, observations, selectedClient, editingEventId, isPreScheduled, currentUser, originalEvent, originalPaymentStatus, syncEvent]);

  // Reset endTime and endDate when startTime changes
  useEffect(() => {
    if (availableEndTimeSlots.length > 0) {
      const currentSelectionValid = availableEndTimeSlots.some(opt => opt.time === endTime && endDate && format(opt.date, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd'));
      if (!currentSelectionValid) {
        setEndTime(availableEndTimeSlots[0].time);
        setEndDate(availableEndTimeSlots[0].date);
      }
    } else setEndTime('');
  }, [availableEndTimeSlots, endTime, endDate]);

  // Initial validation for startTime
  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(startTime)) setStartTime(availableTimeSlots[0]);
  }, [availableTimeSlots, startTime]);

  return {
    isLoading, editingEventId, selectedDate, endDate, startTime, endTime, scheduledEvents, isPreScheduled, availableBoats, selectedBoat, isCapacityExceeded, isBusinessClosed, availableBoardingLocations, selectedBoardingLocation, availableTourTypes, selectedTourType, availableProducts, selectedProducts, rentalDiscount, passengerCount, boatRentalCost, subtotal, totalDiscount, total, tax, taxDescription, observations, setObservations, selectedClient, clientSearchTerm, clientSearchResults, isSearching, loyaltySuggestion, availableTimeSlots, availableEndTimeSlots, isModalOpen, editingClient, newClientName, newClientPhone, setSelectedDate, setEndDate, setStartTime, setEndTime, setIsPreScheduled, handleBoatSelection, handleBoardingLocationSelection, handleTourTypeSelection, handleSaveTourType, updateHourlyProductTime, updateEndDateFromTime, toggleProduct, toggleCourtesy, updateProductDiscount, updateDiscountType, updateDiscountValue, updatePassengerCount, updateTax, updateTaxDescription, handleClientSearch, selectClient, clearClientSelection, setNewClientName, setNewClientPhone, handleOpenModal, handleCloseModal, handleSaveClient, handleDeleteClient, createEvent,
  };
};
