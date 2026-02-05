import { Station, Product, Tariff, Customer, StreamingPlatform, StreamingDistributor, StreamingAccount, ServiceOrder, Sale, Expense } from './types';

export const INITIAL_TARIFFS: Tariff[] = [];

export const INITIAL_STATIONS: Station[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'public', name: 'Venta al Público', points: 0 },
];

export const INITIAL_PLATFORMS: StreamingPlatform[] = [];

export const INITIAL_DISTRIBUTORS: StreamingDistributor[] = [];

export const INITIAL_STREAMING_ACCOUNTS: StreamingAccount[] = [];

export const INITIAL_SERVICE_ORDERS: ServiceOrder[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_SALES: Sale[] = [];