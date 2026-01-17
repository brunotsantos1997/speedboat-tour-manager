// src/viewmodels/useCreateEventViewModel.ts
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Product, Discount, SelectedProduct, ClientProfile, Boat, Event as EventType } from '../core/domain/types';
import { LOYALTY_RULES } from '../core/data/mocks';
import { clientRepository } from '../core/repositories/ClientRepository';
import { productRepository } from '../core/repositories/ProductRepository';
import { boatRepository } from '../core/repositories/BoatRepository';
import { eventRepository } from '../core/repositories/EventRepository';
import { formatDate } from '../core/utils/formatDate';
import type { BoardingLocation } from '../core/domain/types';
import { MockBoardingLocationRepository } from '../core/repositories/MockBoardingLocationRepository';

export const useCreateEventViewModel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editingEventId, setEditingEventId] = useState<string | null>(searchParams.get('eventId'));

  // Event State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [scheduledEvents, setScheduledEvents] = useState<EventType[]>([]);

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

  // Confirmation Modal State
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState({ title: '', message: '' });

  // Effect to load event for editing
  useEffect(() => {
    const loadEventForEditing = async () => {
      if (editingEventId) {
        const event = await eventRepository.getById(editingEventId);
        if (event) {
          // Be careful with date parsing, ensure correct timezone handling
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
        } else {
          console.error("Event to edit not found!");
          setEditingEventId(null); // Clear ID if not found
        }
      }
    };

    loadEventForEditing();
  }, [editingEventId]);

  // Fetch initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const products = await productRepository.getAll();
      const boats = await boatRepository.getAll();
      const boardingLocations = await new MockBoardingLocationRepository().getAll();

      setAvailableProducts(products);
      setAvailableBoats(boats);
      setAvailableBoardingLocations(boardingLocations);

      if (boats.length > 0) {
        setSelectedBoat(boats[0]);
      }

      if (boardingLocations.length > 0) {
        setSelectedBoardingLocation(boardingLocations[0]);
      }

      // Set default courtesies
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
      const dateString = formatDate(selectedDate);
      eventRepository.getEventsByDate(dateString).then(setScheduledEvents);
    }
  }, [selectedDate]);

  // Handlers for Products, Discount, Passengers
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

  // Client Management Handlers
  const handleClientSearch = useCallback(async (term: string) => {
    setClientSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      const results = await clientRepository.search(term);
      setClientSearchResults(results);
      setIsSearching(false);
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

  // --- Client CRUD Handlers ---

  const handleOpenModal = (client: ClientProfile | null = null) => {
    if (client) {
      setEditingClient(client);
      setNewClientName(client.name);
      setNewClientPhone(client.phone);
    } else {
      setEditingClient(null);
      setNewClientName('');
      setNewClientPhone('');
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
    if (!newClientName || !newClientPhone) {
      throw new Error('Nome e telefone do cliente são obrigatórios.');
    }

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
      if (clientSearchTerm.length > 2) {
        handleClientSearch(clientSearchTerm);
      }
    } catch (error) {
      console.error("Failed to save client:", error);
      throw new Error('Falha ao salvar o cliente. Por favor, tente novamente.');
    }
  }, [editingClient, newClientName, newClientPhone, selectedClient, clientSearchTerm, handleClientSearch, selectClient]);

  const openConfirmationModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationMessage({ title, message });
    setConfirmationAction(() => onConfirm); // Store the action
    setIsConfirmationModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setConfirmationAction(null);
  };

  const confirmAction = () => {
    if (confirmationAction) {
      confirmationAction();
    }
    closeConfirmationModal();
  };

  const handleDeleteClient = useCallback(async (clientId: string) => {
    openConfirmationModal(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.',
      async () => {
        await clientRepository.delete(clientId);
        if (selectedClient?.id === clientId) {
          clearClientSelection();
        }
        handleClientSearch(clientSearchTerm);
      }
    );
  }, [selectedClient, clientSearchTerm, handleClientSearch, clearClientSelection]);


  // Derived State: Calculations & Validations
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

    let cost = hours * selectedBoat.pricePerHour;
    if (remainingMinutes >= 30) {
      cost += selectedBoat.pricePerHalfHour;
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

  const total = useMemo(() => Math.max(0, subtotal - totalDiscount), [subtotal, totalDiscount]);

  const createEvent = useCallback(async () => {
    if (!selectedDate || !selectedClient || !selectedBoat || !selectedBoardingLocation) {
      throw new Error('Por favor, preencha todos os campos obrigatórios: Data, Cliente, Lancha e Local de Embarque.');
    }

    const eventData = {
      date: formatDate(selectedDate),
      startTime: startTime,
      endTime: endTime,
      status: 'SCHEDULED' as const,
      boat: selectedBoat,
      boardingLocation: selectedBoardingLocation,
      products: selectedProducts,
      discount,
      client: selectedClient,
      passengerCount,
      subtotal,
      total,
      observations,
    };

    if (editingEventId) {
      const updatedEvent = { ...eventData, id: editingEventId };
      await eventRepository.update(updatedEvent);
    } else {
      await eventRepository.add(eventData);
    }
    navigate(`/clients?clientId=${selectedClient.id}`);
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
    navigate,
    editingEventId,
    selectedBoardingLocation,
    observations
  ]);

  // Side Effects: Loyalty Checks (same as before)
  useEffect(() => {
    if (!selectedClient) {
      setLoyaltySuggestion(null);
      return;
    }
    let suggestion: string | null = null;
    const recurrenceRule = LOYALTY_RULES.find(r => r.type === 'RECURRENCE');
    if (recurrenceRule && recurrenceRule.threshold && (selectedClient.totalTrips + 1) % recurrenceRule.threshold === 0) {
      suggestion = recurrenceRule.message;
    }
    const today = new Date().toISOString().split('T')[0];
    const specialDateRule = LOYALTY_RULES.find(r => r.type === 'SPECIAL_DATE' && r.date === today);
    if (specialDateRule) {
      suggestion = suggestion ? `${suggestion} ${specialDateRule.message}` : specialDateRule.message;
    }
    setLoyaltySuggestion(suggestion);
  }, [selectedClient]);

  return {
    // Event State
    editingEventId,
    selectedDate,
    startTime,
    endTime,
    scheduledEvents,
    // Boat State
    availableBoats,
    selectedBoat,
    isCapacityExceeded,
    // Boarding Location State
    availableBoardingLocations,
    selectedBoardingLocation,
    // State & Derived State
    availableProducts,
    selectedProducts,
    discount,
    passengerCount,
    boatRentalCost,
    subtotal,
    totalDiscount,
    total,
    observations,
    // Client state
    selectedClient,
    clientSearchTerm,
    clientSearchResults,
    isSearching,
    loyaltySuggestion,
    // Modal state
    isModalOpen,
    editingClient,
    newClientName,
    newClientPhone,
    isConfirmationModalOpen,
    confirmationMessage,
    // Handlers
    confirmAction,
    closeConfirmationModal,
    setObservations,
    setSelectedDate,
    setStartTime,
    setEndTime,
    handleBoatSelection,
    handleBoardingLocationSelection,
    updateHourlyProductTime,
    toggleProduct,
    toggleCourtesy,
    updateDiscountType,
    updateDiscountValue,
    updatePassengerCount,
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
