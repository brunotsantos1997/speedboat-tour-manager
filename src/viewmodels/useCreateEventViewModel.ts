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
import { timeToMinutes, minutesToTime } from '../core/utils/timeUtils';
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
    if (!selectedBoat || !startTime || !endTime) return 0;

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const durationInMinutes = endMin - startMin;

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
            const startMin = timeToMinutes(product.startTime);
            const endMin = timeToMinutes(product.endTime);
            const durationInMinutes = endMin - startMin;
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

    const productsRevenue = selectedProducts.reduce((acc, p) => {
        if (p.isCourtesy) return acc;
        if (p.pricingType === 'PER_PERSON') return acc + (p.price || 0) * passengerCount;
        if (p.pricingType === 'HOURLY' && p.startTime && p.endTime && p.hourlyPrice) {
            const d = (timeToMinutes(p.endTime) - timeToMinutes(p.startTime)) / 60;
            return acc + (d > 0 ? d * p.hourlyPrice : 0);
        }
        return acc + (p.price || 0);
    }, 0);

    const rentalRevenue = boatRentalCost;

    const eventStatus = isPreScheduled ? 'PRE_SCHEDULED' : 'SCHEDULED';

    const eventData: any = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: startTime,
      endTime: endTime,
      status: eventStatus as EventType['status'],
      paymentStatus: (editingEventId && originalPaymentStatus === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING') as PaymentStatus,
      boat: selectedBoat,
      boardingLocation: selectedBoardingLocation,
      products: selectedProducts,
      discount,
      client: selectedClient,
      passengerCount,
      subtotal,
      total,
      tax: tax || 0,
      observations,
      rentalRevenue,
      productsRevenue,
    };

    if (isPreScheduled) {
      eventData.preScheduledAt = Date.now();
    }

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

    return selectedClient;
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
    tax,
    boatRentalCost
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
    // Generate all minutes of the day (1440 slots)
    const allDaySlots = Array.from({ length: 1440 }, (_, i) => minutesToTime(i));

    if (!companyData || isBusinessClosed || !dayOfWeek) {
      return [];
    }
    const { startTime: businessStartTime, endTime: businessEndTime } = companyData.businessHours[dayOfWeek];
    const businessStartMin = timeToMinutes(businessStartTime);
    const businessEndMin = timeToMinutes(businessEndTime);

    // Initial filter by business hours (start time must be within business hours)
    // and must allow at least 30 min before closing.
    let validSlots = allDaySlots.filter(slot => {
      const min = timeToMinutes(slot);
      return min >= businessStartMin && min <= (businessEndMin - 30);
    });

    if (!selectedBoat) {
      return validSlots;
    }

    const orgTime = selectedBoat.organizationTimeMinutes || 0;
    const otherBoatEvents = scheduledEvents.filter(event => event.boat?.id === selectedBoat.id && event.id !== editingEventId);

    return validSlots.filter(slot => {
      const slotMin = timeToMinutes(slot);
      const slotEndMin = slotMin + 30; // Minimum duration

      return !otherBoatEvents.some(event => {
        const eventStartMin = timeToMinutes(event.startTime);
        const eventEndMin = timeToMinutes(event.endTime);

        // An event starting at slotMin is valid if its blocked window [slotMin - org, slotEndMin + org]
        // doesn't overlap with existing event's blocked window [eventStart - org, eventEnd + org].
        // This is equivalent to:
        // slotEndMin + org <= eventStartMin - org  => slotEndMin <= eventStartMin - 2*org
        // OR
        // slotMin - org >= eventEndMin + org  => slotMin >= eventEndMin + 2*org

        const isBefore = slotEndMin <= (eventStartMin - 2 * orgTime);
        const isAfter = slotMin >= (eventEndMin + 2 * orgTime);

        return !isBefore && !isAfter;
      });
    });
  }, [scheduledEvents, selectedBoat, editingEventId, companyData, dayOfWeek, isBusinessClosed]);

  const availableEndTimeSlots = useMemo(() => {
    if (!startTime || !selectedBoat) {
      return [];
    }

    const startMin = timeToMinutes(startTime);
    const orgTime = selectedBoat.organizationTimeMinutes || 0;

    // Generate options: startTime + n * 30
    const options: string[] = [];
    for (let n = 1; ; n++) {
      const endMin = startMin + n * 30;
      if (endMin > 1440) break; // End of day

      const endTimeStr = minutesToTime(endMin);

      // Check if this endTime exceeds business hours (if we want to enforce it)
      if (companyData && dayOfWeek) {
        const { endTime: businessEndTime } = companyData.businessHours[dayOfWeek];
        if (endMin > timeToMinutes(businessEndTime)) break;
      }

      // Check for conflicts with next events
      const hasConflict = scheduledEvents
        .filter(event => event.boat?.id === selectedBoat.id && event.id !== editingEventId)
        .some(event => {
          const eventStartMin = timeToMinutes(event.startTime);
          // Gap must be at least 2 * orgTime
          return endMin > (eventStartMin - 2 * orgTime) && startMin < (timeToMinutes(event.endTime) + 2 * orgTime);
        });

      if (hasConflict) break; // Cannot go further if we hit a conflict

      options.push(endTimeStr);
    }

    return options;
  }, [startTime, scheduledEvents, selectedBoat, editingEventId, companyData, dayOfWeek]);


  // Reset endTime when startTime changes
  useEffect(() => {
    if (availableEndTimeSlots.length > 0) {
      // If current endTime is not in the new available list, or if it's invalid, reset it.
      if (!availableEndTimeSlots.includes(endTime)) {
        setEndTime(availableEndTimeSlots[0]);
      }
    } else {
      setEndTime('');
    }
  }, [availableEndTimeSlots]);

  // Initial validation for startTime
  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(startTime)) {
      // Find closest available time or just pick first
       setStartTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots]);


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
