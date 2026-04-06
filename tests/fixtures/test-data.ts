// tests/fixtures/test-data.ts
import type { EventType, ClientProfile, Boat, TourType, BoardingLocation, Product, SelectedProduct, Payment, Expense, Income, PaymentMethod, PaymentStatus, PaymentType } from '../../src/core/domain/types';

export interface TestFixtures {
  clients: ClientProfile[];
  boats: Boat[];
  tourTypes: TourType[];
  boardingLocations: BoardingLocation[];
  products: Product[];
  selectedProducts: SelectedProduct[];
  events: EventType[];
  payments: Payment[];
  expenses: Expense[];
  incomes: Income[];
}

export const createTestFixtures = (): TestFixtures => {
  const timestamp = Date.now();
  
  // ClientProfiles
  const clients: ClientProfile[] = [
    {
      id: `client-1-${timestamp}`,
      name: 'João Silva',
      phone: '+5511999998888',
      totalTrips: 5
    },
    {
      id: `client-2-${timestamp}`,
      name: 'Maria Santos',
      phone: '+551188887777',
      totalTrips: 2
    }
  ];

  // Boats
  const boats: Boat[] = [
    {
      id: `boat-1-${timestamp}`,
      name: 'Lancha Veloz',
      capacity: 10,
      size: 25,
      pricePerHour: 200,
      costPerHour: 100,
      pricePerHalfHour: 120,
      costPerHalfHour: 60,
      organizationTimeMinutes: 15
    },
    {
      id: `boat-2-${timestamp}`,
      name: 'Catamarã Relax',
      capacity: 15,
      size: 35,
      pricePerHour: 300,
      costPerHour: 150,
      pricePerHalfHour: 180,
      costPerHalfHour: 90,
      organizationTimeMinutes: 20
    }
  ];

  // Tour Types
  const tourTypes: TourType[] = [
    {
      id: `tour-1-${timestamp}`,
      name: 'Passeio Privado',
      color: '#3B82F6'
    },
    {
      id: `tour-2-${timestamp}`,
      name: 'Compartilhado',
      color: '#10B981'
    }
  ];

  // Boarding Locations
  const boardingLocations: BoardingLocation[] = [
    {
      id: `location-1-${timestamp}`,
      name: 'Marina Santos',
      mapLink: 'https://maps.google.com/?q=Marina+Santos'
    }
  ];

  // Products
  const products: Product[] = [
    {
      id: `product-1-${timestamp}`,
      name: 'Água Mineral',
      price: 5,
      cost: 2,
      pricingType: 'PER_PERSON',
      iconKey: 'Utensils',
      isDefaultCourtesy: false
    },
    {
      id: `product-2-${timestamp}`,
      name: 'Kit Snorkel',
      price: 30,
      cost: 15,
      pricingType: 'FIXED',
      iconKey: 'Package',
      isDefaultCourtesy: false
    }
  ];

  // SelectedProducts (with isCourtesy)
  const selectedProducts: SelectedProduct[] = [
    {
      ...products[0],
      isCourtesy: false
    },
    {
      ...products[1],
      isCourtesy: false
    }
  ];

  // Events
  const today = new Date();
  const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  const events: EventType[] = [
    {
      id: `event-1-${timestamp}`,
      date: futureDate.toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '14:00',
      passengerCount: 8,
      status: 'SCHEDULED',
      paymentStatus: 'PENDING',
      subtotal: 800,
      total: 800,
      rentalGross: 800,
      productsRevenue: 0,
      observations: 'Passeio teste para validação',
      client: clients[0],
      boat: boats[0],
      tourType: tourTypes[0],
      boardingLocation: boardingLocations[0],
      products: [],
      googleCalendarEventIds: {}
    },
    {
      id: `event-2-${timestamp}`,
      date: futureDate.toISOString().split('T')[0],
      startTime: '15:00',
      endTime: '17:00',
      passengerCount: 6,
      status: 'COMPLETED',
      paymentStatus: 'CONFIRMED',
      subtotal: 600,
      total: 630,
      rentalGross: 600,
      productsRevenue: 30,
      observations: 'Passeio finalizado',
      client: clients[1],
      boat: boats[1],
      tourType: tourTypes[1],
      boardingLocation: boardingLocations[0],
      products: [selectedProducts[0]],
      googleCalendarEventIds: {}
    }
  ];

  // Payments
  const payments: Payment[] = [
    {
      id: `payment-1-${timestamp}`,
      eventId: events[1].id,
      amount: 630,
      method: 'PIX' as PaymentMethod,
      type: 'FULL' as PaymentType,
      status: 'CONFIRMED' as PaymentStatus,
      date: futureDate.toISOString().split('T')[0],
      timestamp: timestamp - 7200000 // 2 hours ago
    }
  ];

  // Expenses
  const expenses: Expense[] = [
    {
      id: `expense-1-${timestamp}`,
      description: 'Combustível lancha',
      amount: 150,
      date: futureDate.toISOString().split('T')[0],
      categoryId: 'fuel-category',
      categoryName: 'Combustível',
      boatId: boats[0].id,
      boatName: boats[0].name,
      status: 'PAID',
      paymentMethod: 'CASH' as PaymentMethod,
      timestamp: timestamp - 3600000 // 1 hour ago
    }
  ];

  // Incomes
  const incomes: Income[] = [
    {
      id: `income-1-${timestamp}`,
      description: 'Venda de produtos extras',
      amount: 50,
      date: futureDate.toISOString().split('T')[0],
      paymentMethod: 'CASH' as PaymentMethod,
      timestamp: timestamp - 1800000 // 30 minutes ago
    }
  ];

  return {
    clients,
    boats,
    tourTypes,
    boardingLocations,
    products,
    selectedProducts,
    events,
    payments,
    expenses,
    incomes
  };
};

// Helper functions for test setup
export const setupTestData = async (fixtures: TestFixtures) => {
  // This would be implemented to actually seed the test database
  // For now, it's a placeholder that shows the intended structure
  console.log('Setting up test data with fixtures:', {
    clients: fixtures.clients.length,
    boats: fixtures.boats.length,
    events: fixtures.events.length,
    payments: fixtures.payments.length
  });
  
  return fixtures;
};

export const cleanupTestData = async (fixtures: TestFixtures) => {
  // This would clean up test data after tests
  console.log('Cleaning up test data...');
};
