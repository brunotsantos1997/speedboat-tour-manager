// src/viewmodels/event/useEventDataState.ts
import { useState, useCallback } from 'react';
import type { Product, Discount, SelectedProduct, Boat, EventType, CompanyData, BoardingLocation, TourType } from '../../core/domain/types';

export const useEventDataState = (initialEvent?: EventType | null) => {
  // Event State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialEvent ? new Date(initialEvent.date + 'T00:00') : new Date()
  );
  const [startTime, setStartTime] = useState(initialEvent?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialEvent?.endTime || '13:00');
  const [scheduledEvents, setScheduledEvents] = useState<EventType[]>([]);
  const [isPreScheduled, setIsPreScheduled] = useState<boolean>(initialEvent?.status === 'PRE_SCHEDULED' || true);

  // Boat State
  const [availableBoats, setAvailableBoats] = useState<Boat[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(initialEvent?.boat || null);

  // Boarding Location State
  const [availableBoardingLocations, setAvailableBoardingLocations] = useState<BoardingLocation[]>([]);
  const [selectedBoardingLocation, setSelectedBoardingLocation] = useState<BoardingLocation | null>(
    initialEvent?.boardingLocation || null
  );

  // Tour Type State
  const [availableTourTypes, setAvailableTourTypes] = useState<TourType[]>([]);
  const [selectedTourType, setSelectedTourType] = useState<TourType | null>(initialEvent?.tourType || null);

  // Core State
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(initialEvent?.products || []);
  const [rentalDiscount, setRentalDiscount] = useState<Discount>(
    initialEvent?.rentalDiscount || { type: 'FIXED', value: 0 }
  );
  const [passengerCount, setPassengerCount] = useState(initialEvent?.passengerCount || 1);
  const [observations, setObservations] = useState(initialEvent?.observations || '');
  const [tax, setTax] = useState(initialEvent?.tax || 0);
  const [taxDescription, setTaxDescription] = useState(initialEvent?.taxDescription || '');

  // Company Data
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Product handlers
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
    setSelectedProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, isCourtesy: !p.isCourtesy } : p)
    );
  }, []);

  const updateProductDiscount = useCallback((productId: string, discount: Discount) => {
    setSelectedProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, discount } : p)
    );
  }, []);

  // Discount handlers
  const updateDiscountType = useCallback((type: 'FIXED' | 'PERCENTAGE') => {
    setRentalDiscount(prev => ({ ...prev, type }));
  }, []);

  const updateDiscountValue = useCallback((value: number) => {
    const val = isNaN(value) || value < 0 ? 0 : value;
    setRentalDiscount(prev => ({ ...prev, value: val }));
  }, []);

  // Basic field handlers
  const updatePassengerCount = useCallback((count: number) => {
    const newCount = Math.max(1, count);
    if (!isNaN(newCount)) {
      setPassengerCount(newCount);
    }
  }, []);

  const updateTax = useCallback((value: number) => {
    setTax(isNaN(value) || value < 0 ? 0 : value);
  }, []);

  const updateTaxDescription = useCallback((desc: string) => {
    setTaxDescription(desc);
  }, []);

  const updateObservations = useCallback((obs: string) => {
    setObservations(obs);
  }, []);

  // Selection handlers
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

  // Time handlers
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

  // Date/time handlers
  const updateSelectedDate = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
  }, []);

  const updateStartTime = useCallback((time: string) => {
    setStartTime(time);
  }, []);

  const updateEndTime = useCallback((time: string) => {
    setEndTime(time);
  }, []);

  // Status handlers
  const updateIsPreScheduled = useCallback((preScheduled: boolean) => {
    setIsPreScheduled(preScheduled);
  }, []);

  // Data setters for loading initial data
  const setReferenceData = useCallback((data: {
    products: Product[];
    boats: Boat[];
    boardingLocations: BoardingLocation[];
    tourTypes: TourType[];
    companyData?: CompanyData | null;
  }) => {
    setAvailableProducts(data.products);
    setAvailableBoats(data.boats);
    setAvailableBoardingLocations(data.boardingLocations);
    setAvailableTourTypes(data.tourTypes);
    if (data.companyData) setCompanyData(data.companyData);

    // Set defaults for new event
    if (!initialEvent) {
      if (data.boats.length > 0) setSelectedBoat(data.boats[0]);
      if (data.boardingLocations.length > 0) setSelectedBoardingLocation(data.boardingLocations[0]);
      if (data.tourTypes.length > 0) {
        const defaultTourType = data.tourTypes.find(t => t.name.toLowerCase() === 'passeio') || data.tourTypes[0];
        setSelectedTourType(defaultTourType);
      }
      const defaultCourtesies = data.products
        .filter(p => p.isDefaultCourtesy)
        .map(p => ({ ...p, isCourtesy: true }));
      setSelectedProducts(defaultCourtesies);
    }
  }, [initialEvent]);

  const setScheduledEventsData = useCallback((events: EventType[]) => {
    setScheduledEvents(events);
  }, []);

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    // State
    selectedDate,
    startTime,
    endTime,
    scheduledEvents,
    isPreScheduled,
    availableBoats,
    selectedBoat,
    availableBoardingLocations,
    selectedBoardingLocation,
    availableTourTypes,
    selectedTourType,
    availableProducts,
    selectedProducts,
    rentalDiscount,
    passengerCount,
    observations,
    tax,
    taxDescription,
    companyData,
    isLoading,

    // Actions
    toggleProduct,
    toggleCourtesy,
    updateProductDiscount,
    updateDiscountType,
    updateDiscountValue,
    updatePassengerCount,
    updateTax,
    updateTaxDescription,
    updateObservations,
    handleBoatSelection,
    handleBoardingLocationSelection,
    handleTourTypeSelection,
    updateHourlyProductTime,
    updateSelectedDate,
    updateStartTime,
    updateEndTime,
    updateIsPreScheduled,

    // Data setters
    setReferenceData,
    setScheduledEventsData,
    setLoadingState,
  };
};
