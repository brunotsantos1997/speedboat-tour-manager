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

export const useCreateEventViewModel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editingEventId, setEditingEventId] = useState<string | null>(searchParams.get('eventId'));

  // Event State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [scheduledEvents, setScheduledEvents] = useState<EventType[]>([]);

  // Boat State
  const [availableBoats, setAvailableBoats] = useState<Boat[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);

  // Core State
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [discount, setDiscount] = useState<Discount>({ type: 'FIXED', value: 0 });
  const [passengerCount, setPassengerCount] = useState(1);

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
          setSelectedTime(event.time);
          setSelectedBoat(event.boat);
          setSelectedProducts(event.products);
          setDiscount(event.discount);
          setPassengerCount(event.passengerCount);
          setSelectedClient(event.client);
          setClientSearchTerm(event.client.name);
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

      setAvailableProducts(products);
      setAvailableBoats(boats);

      if (boats.length > 0) {
        setSelectedBoat(boats[0]);
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
    if (!newClientName || !newClientPhone) return;

    if (editingClient) {
      // Update existing client
      const updatedClient = { ...editingClient, name: newClientName, phone: newClientPhone };
      const result = await clientRepository.update(updatedClient);
      // If the edited client was selected, update the selection
      if (selectedClient?.id === result.id) {
        setSelectedClient(result);
        setClientSearchTerm(result.name);
      }
    } else {
      // Add new client
      const newClient = await clientRepository.add({ id: '', name: newClientName, phone: newClientPhone });
      selectClient(newClient);
    }

    handleCloseModal();
    // Refresh search results to show changes
    if (clientSearchTerm.length > 2) {
      handleClientSearch(clientSearchTerm);
    }
  }, [editingClient, newClientName, newClientPhone, selectedClient, clientSearchTerm, handleClientSearch, selectClient]);

  const handleDeleteClient = useCallback(async (clientId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await clientRepository.delete(clientId);
      // If the deleted client was selected, clear the selection
      if (selectedClient?.id === clientId) {
        clearClientSelection();
      }
      // Refresh search results
       handleClientSearch(clientSearchTerm);
    }
  }, [selectedClient, clientSearchTerm, handleClientSearch, clearClientSelection]);


  // Derived State: Calculations & Validations
  const isCapacityExceeded = useMemo(() => {
    if (!selectedBoat) return false;
    return passengerCount > selectedBoat.capacity;
  }, [passengerCount, selectedBoat]);

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
    }, 0);
  }, [selectedProducts, passengerCount]);

  const totalDiscount = useMemo(() => {
    if (discount.type === 'FIXED') return discount.value;
    return subtotal * (discount.value / 100);
  }, [subtotal, discount]);

  const total = useMemo(() => Math.max(0, subtotal - totalDiscount), [subtotal, totalDiscount]);

  const createEvent = useCallback(async () => {
    if (!selectedDate || !selectedClient || !selectedBoat) {
      alert('Por favor, preencha todos os campos obrigatórios: Data, Cliente e Lancha.');
      return;
    }

    const eventData = {
      date: formatDate(selectedDate),
      time: selectedTime,
      status: 'SCHEDULED' as const,
      boat: selectedBoat,
      products: selectedProducts,
      discount,
      client: selectedClient,
      passengerCount,
      subtotal,
      total,
    };

    try {
      if (editingEventId) {
        const updatedEvent = { ...eventData, id: editingEventId };
        await eventRepository.update(updatedEvent);
        alert('Passeio atualizado com sucesso!');
      } else {
        await eventRepository.add(eventData);
        alert('Passeio agendado com sucesso!');
      }
      navigate(`/clients?clientId=${selectedClient.id}`);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Ocorreu um erro ao salvar o passeio.');
    }
  }, [
    selectedDate,
    selectedTime,
    selectedBoat,
    selectedProducts,
    discount,
    selectedClient,
    passengerCount,
    subtotal,
    total,
    navigate,
    editingEventId
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
    selectedTime,
    scheduledEvents,
    // Boat State
    availableBoats,
    selectedBoat,
    isCapacityExceeded,
    // State & Derived State
    availableProducts,
    selectedProducts,
    discount,
    passengerCount,
    subtotal,
    totalDiscount,
    total,
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
    // Handlers
    setSelectedDate,
    setSelectedTime,
    handleBoatSelection,
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
