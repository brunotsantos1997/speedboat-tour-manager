// src/viewmodels/useSharedEventViewModel.ts
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Boat, EventType, CompanyData, ClientProfile, TourType, PaymentMethod } from '../core/domain/types';
import { clientRepository } from '../core/repositories/ClientRepository';
import { boatRepository } from '../core/repositories/BoatRepository';
import { tourTypeRepository } from '../core/repositories/TourTypeRepository';
import { eventRepository } from '../core/repositories/EventRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';
import { format } from 'date-fns';
import { timeToMinutes, minutesToTime } from '../core/utils/timeUtils';
import { boardingLocationRepository } from '../core/repositories/BoardingLocationRepository';
import { sanitizeObject } from '../core/utils/objectUtils';
import { useToastContext } from '../ui/contexts/ToastContext';

export const useSharedEventViewModel = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToastContext();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [durationHours, setDurationHours] = useState(1);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [costPerPerson, setCostPerPerson] = useState(0);
  const [discountPerPerson, setDiscountPerPerson] = useState(0);
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [observations, setObservations] = useState('');

  const [availableBoats, setAvailableBoats] = useState<Boat[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<EventType[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const existingSharedEvent = useMemo(() => {
    if (!selectedBoat || !startTime) return null;
    return scheduledEvents.find(e =>
      e.boat.id === selectedBoat.id &&
      e.startTime === startTime &&
      e.tourType?.name.toLowerCase() === 'compartilhado' &&
      e.status !== 'CANCELLED' && e.status !== 'ARCHIVED_CANCELLED'
    );
  }, [scheduledEvents, selectedBoat, startTime]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [boats, companyDataResponse] = await Promise.all([
          boatRepository.getAll(),
          CompanyDataRepository.getInstance().get()
        ]);
        const activeBoats = boats.filter(b => !b.isArchived);
        setAvailableBoats(activeBoats);
        if (activeBoats.length > 0) setSelectedBoat(activeBoats[0]);
        if (companyDataResponse) setCompanyData(companyDataResponse);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Fetch events for conflict check
  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      eventRepository.getEventsByDate(dateString).then(setScheduledEvents);
    }
  }, [selectedDate]);

  const endTime = useMemo(() => {
    const startMin = timeToMinutes(startTime);
    const endMin = startMin + (durationHours * 60);
    return minutesToTime(endMin % 1440);
  }, [startTime, durationHours]);

  const subtotal = useMemo(() => {
    return passengerCount * costPerPerson;
  }, [passengerCount, costPerPerson]);

  const totalDiscount = useMemo(() => {
    return (passengerCount * discountPerPerson) + generalDiscount;
  }, [passengerCount, discountPerPerson, generalDiscount]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - totalDiscount);
  }, [subtotal, totalDiscount]);

  const availableTimeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }

    if (!selectedBoat) return slots;

    const orgTime = selectedBoat.organizationTimeMinutes || 0;
    const otherEvents = scheduledEvents.filter(e =>
        e.boat.id === selectedBoat.id &&
        e.status !== 'CANCELLED' &&
        e.status !== 'ARCHIVED_CANCELLED' &&
        e.tourType?.name.toLowerCase() !== 'compartilhado' // Ignore shared for slot visibility, we handle merging later
    );
    const otherEvents = scheduledEvents.filter(e => e.boat.id === selectedBoat.id && e.status !== 'CANCELLED' && e.status !== 'ARCHIVED_CANCELLED');

    return slots.filter(slot => {
      const slotMin = timeToMinutes(slot);
      const slotEndMin = slotMin + (durationHours * 60);

      if (slotEndMin > 1440) return false;

      return !otherEvents.some(event => {
        const eventStartMin = timeToMinutes(event.startTime);
        const eventEndMin = timeToMinutes(event.endTime);

        const isBefore = slotEndMin <= (eventStartMin - 2 * orgTime);
        const isAfter = slotMin >= (eventEndMin + 2 * orgTime);

        return !isBefore && !isAfter;
      });
    });
  }, [selectedBoat, scheduledEvents, durationHours]);

  const getOrCreateSharedClient = async (): Promise<ClientProfile> => {
    const results = await clientRepository.search('Compartilhado');
    let sharedClient = results.find(c => c.name.toLowerCase() === 'compartilhado');

    if (!sharedClient) {
      sharedClient = await clientRepository.add({
        name: 'Compartilhado',
        phone: '00000000000',
      });
    }
    return sharedClient;
  };

  const getOrCreateSharedTourType = async (): Promise<TourType> => {
    const tourTypes = await tourTypeRepository.getAll();
    let sharedType = tourTypes.find(t => t.name.toLowerCase() === 'compartilhado');

    if (!sharedType) {
      sharedType = await tourTypeRepository.add({
        name: 'Compartilhado',
        color: '#6366f1', // Indigo 500
        isArchived: false
      });
    }
    return sharedType;
  };

  // Reset startTime if not in available slots
  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(startTime)) {
      setStartTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots, startTime]);

  const createSharedEvent = async () => {
    if (!selectedBoat || !startTime) {
      showToast('Selecione um barco e horário.');
      return false;
    }

    try {
      if (existingSharedEvent) {
        // Update existing event
        const updatedEvent: EventType = {
          ...existingSharedEvent,
          passengerCount: existingSharedEvent.passengerCount + passengerCount,
          subtotal: existingSharedEvent.subtotal + subtotal,
          total: existingSharedEvent.total + total,
          rentalGross: (existingSharedEvent.rentalGross || 0) + subtotal,
          rentalRevenue: (existingSharedEvent.rentalRevenue || 0) + total,
          observations: existingSharedEvent.observations
            ? `${existingSharedEvent.observations}\n---\nNovo grupo: ${passengerCount} pessoas. ${observations}`
            : `Grupo inicial: ${existingSharedEvent.passengerCount} pessoas.\nNovo grupo: ${passengerCount} pessoas. ${observations}`,
        };

        await eventRepository.updateEvent(updatedEvent);

        // Register payment for the NEW group only
        await paymentRepository.add({
          eventId: existingSharedEvent.id,
          amount: total,
          method: paymentMethod,
          type: 'FULL',
          date: format(new Date(), 'yyyy-MM-dd'),
          timestamp: Date.now()
        });

        showToast('Passageiros adicionados ao passeio compartilhado existente!');
        return true;
      }

      const [sharedClient, sharedTourType, boardingLocations] = await Promise.all([
        getOrCreateSharedClient(),
        getOrCreateSharedTourType(),
        boardingLocationRepository.getAll()
      ]);

      const defaultLocation = boardingLocations[0];

      if (!defaultLocation) {
        throw new Error('Nenhum local de embarque configurado.');
      }

      const eventData: Partial<EventType> = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        status: 'SCHEDULED',
        paymentStatus: 'CONFIRMED',
        boat: selectedBoat,
        boardingLocation: defaultLocation,
        tourType: sharedTourType,
        products: [],
        rentalDiscount: { type: 'FIXED', value: totalDiscount },
        client: sharedClient,
        passengerCount,
        subtotal: subtotal,
        total: total,
        observations: observations,
        rentalRevenue: total,
        productsRevenue: 0,
        rentalGross: subtotal,
        productsGross: 0,
        rentalCost: 0,
        productsCost: 0,
        taxCost: 0,
        additionalCosts: [],
        createdByUserId: currentUser?.id,
      };

      const newEvent = await eventRepository.add(sanitizeObject(eventData));

      // Register payment
      await paymentRepository.add({
        eventId: newEvent.id,
        amount: total,
        method: paymentMethod,
        type: 'FULL',
        date: format(new Date(), 'yyyy-MM-dd'),
        timestamp: Date.now()
      });

      showToast('Passeio compartilhado criado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error creating shared event:', error);
      showToast(error.message || 'Erro ao criar passeio compartilhado.');
      return false;
    }
  };

  return {
    isLoading,
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    durationHours,
    setDurationHours,
    selectedBoat,
    setSelectedBoat,
    passengerCount,
    setPassengerCount,
    costPerPerson,
    setCostPerPerson,
    discountPerPerson,
    setDiscountPerPerson,
    generalDiscount,
    setGeneralDiscount,
    paymentMethod,
    setPaymentMethod,
    observations,
    setObservations,
    availableBoats,
    availableTimeSlots,
    subtotal,
    totalDiscount,
    total,
    existingSharedEvent,
    createSharedEvent
  };
};
