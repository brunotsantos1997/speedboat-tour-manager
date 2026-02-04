// src/viewmodels/useCreateEventViewModel.ts
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { DayOfWeek, Product, Discount, SelectedProduct, ClientProfile, Boat, EventType, PaymentStatus, CompanyData } from '../core/domain/types';
import { clientRepository } from '../core/repositories/ClientRepository';
import { productRepository } from '../core/repositories/ProductRepository';
import { boatRepository } from '../core/repositories/BoatRepository';
import { eventRepository } from '../core/repositories/EventRepository';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';
import { format } from 'date-fns';
import type { BoardingLocation } from '../core/domain/types';
import { boardingLocationRepository } from '../core/repositories/BoardingLocationRepository';

export const useCreateEventViewModel = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [editingEventId, setEditingEventId] = useState<string | null>(searchParams.get('eventId'));
  const [originalEvent, setOriginalEvent] = useState<EventType | null>(null);
  const [originalPaymentStatus, setOriginalPaymentStatus] = useState<PaymentStatus | undefined>(undefined);

  // Event State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [scheduledEvents, setScheduledEvents] = useState<EventType[]>([]);
  const [isPreScheduled, setIsPreScheduled] = useState(false);

  // Boat State
  const [availableBoats, setAvailableBoats] = useState<Boat[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);

  // Boarding Location State
  const [availableBoardingLocations, setAvailableBoardingLocations] = useState<BoardingLocation[]>([]);
  const [selectedBoardingLocation, setSelectedBoardingLocation] = useState<BoardingLocation | null>(null);

  // Core State
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [discount, setDiscount] = useState<Discount>({ type: 'FIXED', value: 0 });
  const [passengerCount, setPassengerCount] = useState(1);
  const [observations, setObservations] = useState('');
  const [tax, setTax] = useState(0);

  // Client Management State
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<ClientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loyaltySuggestion, setLoyaltySuggestion] = useState<string | null>(null);

  // New Client Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Company Data
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  // Effect to load event for editing
  useEffect(() => {
    const loadEventForEditing = async () => {
      if (editingEventId) {
        const event = await eventRepository.getById(editingEventId);
        if (event) {
          setOriginalEvent(event);
          const eventDate = new Date(event.date);
          const userTimezoneOffset = eventDate.getTimezoneOffset() * 60000;

          setSelectedDate(new Date(eventDate.getTime() + userTimezoneOffset));
          setStartTime(event.startTime);
          setEndTime(event.endTime);
          setSelectedBoat(event.boat);
          setSelectedProducts(event.products);
          setDiscount(event.discount);
          setPassengerCount(event.passengerCount);
          setSelectedClient(event.client);
          setClientSearchTerm(event.client.name);
          setObservations(event.observations || '');
          setIsPreScheduled(event.status === 'PRE_SCHEDULED');
          setOriginalPaymentStatus(event.paymentStatus);
          setTax(event.tax || 0);
        } else {
          setEditingEventId(null);
        }
      } else {
        setOriginalEvent(null);
      }
    };

    loadEventForEditing();
  }, [editingEventId]);

  // Fetch initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const products = await productRepository.getAll();
      const boats = await boatRepository.getAll();
      const boardingLocations = await boardingLocationRepository.getAll();
      const companyDataResponse = await CompanyDataRepository.getInstance().get();

      if (companyDataResponse) {
        setCompanyData(companyDataResponse);
      }

      setAvailableProducts(products);
      setAvailableBoats(boats);
      setAvailableBoardingLocations(boardingLocations);

      if (boats.length > 0) {
        setSelectedBoat(boats[0]);
      }

      if (boardingLocations.length > 0) {
        setSelectedBoardingLocation(boardingLocations[0]);
      }

      const defaultCourtesies = products
        .filter(p => p.isDefaultCourtesy)
        .map(p => ({ ...p, isCourtesy: true }));
      setSelectedProducts(defaultCourtesies);
    };

    loadInitialData();
  }, []);

  // Fetch scheduled events when selected date changes
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
        : [...prev, { ...product, isCourtesy: false }]
    );
  }, []);

  const toggleCourtesy = useCallback((productId: string) => {
    setSelectedProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, isCourtesy: !p.isCourtesy } : p)
    );
  }, []);

  const updateDiscountType = useCallback((type: 'FIXED' | 'PERCENTAGE') => {
    setDiscount(prev => ({ ...prev, type }));
  }, []);

  const updateDiscountValue = useCallback((value: number) => {
    setDiscount(prev => ({ ...prev, value: isNaN(value) || value < 0 ? 0 : value }));
  }, []);

  const updatePassengerCount = useCallback((count: number) => {
    const newCount = Math.max(1, count);
    if (!isNaN(newCount)) {
      setPassengerCount(newCount);
    }
  }, []);

  const updateTax = useCallback((value: number) => {
    setTax(isNaN(value) || value < 0 ? 0 : value);
  }, []);

  const handleBoatSelection = (boatId: string) => {
    const boat = availableBoats.find(b => b.id === boatId);
    setSelectedBoat(boat || null);
  };

  const handleBoardingLocationSelection = (locationId: string) => {
    const location = availableBoardingLocations.find(l => l.id === locationId);
    setSelectedBoardingLocation(location || null);
  };

  const updateHourlyProductTime = (productId: string, time: string, type: 'start' | 'end') => {
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
  };

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
      throw error; // Re-throw to be handled by the UI (toast)
    }
  }, [editingClient, newClientName, newClientPhone, selectedClient, clientSearchTerm, handleCloseModal, selectClient]);

  const handleDeleteClient = useCallback(async (clientId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await clientRepository.delete(clientId);
      if (selectedClient?.id === clientId) {
        clearClientSelection();
      }
       handleClientSearch(clientSearchTerm);
    }
  }, [selectedClient, clientSearchTerm, handleClientSearch, clearClientSelection]);


  // Calculations
  const isCapacityExceeded = useMemo(() => {
    if (!selectedBoat) return false;
    return passengerCount > selectedBoat.capacity;
  }, [passengerCount, selectedBoat]);

  const boatRentalCost = useMemo(() => {
    if (!selectedBoat) return 0;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const durationInMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);

    if (durationInMinutes <= 0) return 0;

    const hours = Math.floor(durationInMinutes / 60);
    const remainingMinutes = durationInMinutes % 60;

    let cost = hours * (selectedBoat.pricePerHour || 0);
    if (remainingMinutes >= 30) {
      cost += (selectedBoat.pricePerHalfHour || 0);
    }

    return cost;
  }, [startTime, endTime, selectedBoat]);

  const subtotal = useMemo(() => {
    return selectedProducts.reduce((acc, product) => {
      if (product.isCourtesy) {
        return acc;
      }

      switch (product.pricingType) {
        case 'PER_PERSON':
          return acc + (product.price || 0) * passengerCount;
        case 'HOURLY':
          if (product.startTime && product.endTime && product.hourlyPrice) {
            const [startHour, startMinute] = product.startTime.split(':').map(Number);
            const [endHour, endMinute] = product.endTime.split(':').map(Number);
            const durationInMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
            const durationInHours = durationInMinutes / 60;

            if (durationInHours > 0) {
              return acc + durationInHours * product.hourlyPrice;
            }
          }
          return acc;
        case 'FIXED':
        default:
          return acc + (product.price || 0);
      }
    }, 0) + boatRentalCost;
  }, [selectedProducts, passengerCount, boatRentalCost]);

  const totalDiscount = useMemo(() => {
    if (discount.type === 'FIXED') return discount.value;
    return subtotal * (discount.value / 100);
  }, [subtotal, discount]);

  const total = useMemo(() => Math.max(0, subtotal - totalDiscount + tax), [subtotal, totalDiscount, tax]);

  const createEvent = useCallback(async () => {
    if (!selectedDate || !selectedClient || !selectedBoat || !selectedBoardingLocation) {
      throw new Error('Campos obrigatórios ausentes.');
    }

    const eventStatus = isPreScheduled ? 'PRE_SCHEDULED' : 'SCHEDULED';
    const eventData = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: startTime,
      endTime: endTime,
      status: eventStatus as EventType['status'],
      paymentStatus: (editingEventId && originalPaymentStatus === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING') as PaymentStatus,
      preScheduledAt: isPreScheduled ? Date.now() : undefined,
      boat: selectedBoat,
      boardingLocation: selectedBoardingLocation,
      products: selectedProducts,
      discount,
      client: selectedClient,
      passengerCount,
      subtotal,
      total,
      tax,
      observations,
    };

    if (editingEventId) {
      const updatedEvent = {
        ...eventData,
        id: editingEventId,
        createdByUserId: originalEvent?.createdByUserId,
      };
      await eventRepository.updateEvent(updatedEvent as EventType);
    } else {
      const newEventData = {
        ...eventData,
        createdByUserId: currentUser?.id,
      };
      await eventRepository.add(newEventData);
    }
  }, [
    selectedDate,
    startTime,
    endTime,
    selectedBoat,
    selectedProducts,
    discount,
    selectedClient,
    passengerCount,
    subtotal,
    total,
    editingEventId,
    selectedBoardingLocation,
    observations,
    isPreScheduled,
    currentUser,
    originalEvent,
    originalPaymentStatus,
    tax
  ]);

  useEffect(() => {
    if (!selectedClient) {
      setLoyaltySuggestion(null);
      return;
    }
    setLoyaltySuggestion(null);
  }, [selectedClient]);

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
    const allDaySlots = Array.from({ length: 48 }, (_, i) => {
      const hours = Math.floor(i / 2).toString().padStart(2, '0');
      const minutes = (i % 2 === 0 ? '00' : '30');
      return `${hours}:${minutes}`;
    });

    if (!companyData || isBusinessClosed || !dayOfWeek) {
      return [];
    }
    const { startTime, endTime } = companyData.businessHours[dayOfWeek];
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const closingDate = new Date();
    closingDate.setHours(endHour, endMinute, 0, 0);
    closingDate.setMinutes(closingDate.getMinutes() - 30);
    const finalEndTime = `${closingDate.getHours().toString().padStart(2, '0')}:${closingDate.getMinutes().toString().padStart(2, '0')}`;

    const businessHourSlots = allDaySlots.filter(slot => slot >= startTime && slot <= finalEndTime);

    if (!selectedBoat) {
      return businessHourSlots;
    }
    const otherBoatEvents = scheduledEvents.filter(event => event.boat?.id === selectedBoat.id && event.id !== editingEventId);
    if (otherBoatEvents.length === 0) {
      return businessHourSlots;
    }

    const { eventIntervalMinutes } = companyData;

    const isSlotBooked = (slot: string) => {
      const [slotHour, slotMinute] = slot.split(':').map(Number);
      const slotTime = slotHour * 60 + slotMinute;

      return otherBoatEvents.some(event => {
        if (!event.startTime || !event.endTime) return false;
        const [eventStartHour, eventStartMinute] = event.startTime.split(':').map(Number);
        const eventStartTime = eventStartHour * 60 + eventStartMinute;

        const [eventEndHour, eventEndMinute] = event.endTime.split(':').map(Number);
        const eventEndTime = eventEndHour * 60 + eventEndMinute;

        const blockedWindowStart = eventStartTime - eventIntervalMinutes;
        const blockedWindowEnd = eventEndTime + eventIntervalMinutes;

        return slotTime >= blockedWindowStart && slotTime < blockedWindowEnd;
      });
    };

    return businessHourSlots.filter(slot => !isSlotBooked(slot));
  }, [scheduledEvents, selectedBoat, editingEventId, companyData, dayOfWeek, isBusinessClosed]);

  const availableEndTimeSlots = useMemo(() => {
    if (!startTime || !companyData || isBusinessClosed || !dayOfWeek) {
      return [];
    }

    const allDaySlots = Array.from({ length: 48 }, (_, i) => {
      const hours = Math.floor(i / 2).toString().padStart(2, '0');
      const minutes = (i % 2 === 0 ? '00' : '30');
      return `${hours}:${minutes}`;
    });

    const { endTime: businessEndTime } = companyData.businessHours[dayOfWeek];
    let possibleEndTimes = allDaySlots.filter(slot => slot > startTime && slot <= businessEndTime);

    const nextEvent = scheduledEvents
      .filter(event => event.boat?.id === selectedBoat?.id && event.id !== editingEventId && event.startTime > startTime)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))[0];

    if (nextEvent) {
      const [nextStartHour, nextStartMinute] = nextEvent.startTime.split(':').map(Number);
      const nextStartTimeInMinutes = nextStartHour * 60 + nextStartMinute;
      const maxEndTimeInMinutes = nextStartTimeInMinutes - companyData.eventIntervalMinutes;

      const maxEndHour = Math.floor(maxEndTimeInMinutes / 60);
      const maxEndMinute = maxEndTimeInMinutes % 60;
      const formattedMaxEndMinute = (Math.round(maxEndMinute / 30) * 30) % 60;
      const maxEndTime = `${maxEndHour.toString().padStart(2, '0')}:${formattedMaxEndMinute.toString().padStart(2, '0')}`;

      possibleEndTimes = possibleEndTimes.filter(slot => slot <= maxEndTime);
    }

    return possibleEndTimes;
  }, [startTime, scheduledEvents, selectedBoat, editingEventId, companyData, dayOfWeek, isBusinessClosed]);


  useEffect(() => {
    if (!availableTimeSlots.includes(startTime)) {
      setStartTime(availableTimeSlots[0] || '');
    }
    if (!availableEndTimeSlots.includes(endTime) || endTime <= startTime) {
      setEndTime(availableEndTimeSlots[0] || '');
    }
  }, [availableTimeSlots, availableEndTimeSlots, startTime, endTime]);


  return {
    editingEventId,
    selectedDate,
    startTime,
    endTime,
    scheduledEvents,
    isPreScheduled,
    availableBoats,
    selectedBoat,
    isCapacityExceeded,
    isBusinessClosed,
    availableBoardingLocations,
    selectedBoardingLocation,
    availableProducts,
    selectedProducts,
    discount,
    passengerCount,
    boatRentalCost,
    subtotal,
    totalDiscount,
    total,
    tax,
    observations,
    selectedClient,
    clientSearchTerm,
    clientSearchResults,
    isSearching,
    loyaltySuggestion,
    availableTimeSlots,
    availableEndTimeSlots,
    isModalOpen,
    editingClient,
    newClientName,
    newClientPhone,
    setSelectedDate,
    setStartTime,
    setEndTime,
    setIsPreScheduled,
    handleBoatSelection,
    handleBoardingLocationSelection,
    updateHourlyProductTime,
    toggleProduct,
    toggleCourtesy,
    updateDiscountType,
    updateDiscountValue,
    updatePassengerCount,
    updateTax,
    handleClientSearch,
    selectClient,
    clearClientSelection,
    setNewClientName,
    setNewClientPhone,
    handleOpenModal,
    handleCloseModal,
    handleSaveClient,
    handleDeleteClient,
    createEvent,
  };
};
