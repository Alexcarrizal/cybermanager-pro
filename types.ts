
export enum DeviceType {
  PC = 'PC',
  XBOX = 'XBOX',
  PS5 = 'PS5',
  NINTENDO = 'NINTENDO'
}

export enum StationStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE'
}

export enum SessionType {
  OPEN = 'OPEN',
  FIXED = 'FIXED',
  FREE = 'FREE'
}

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CLIP';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  points: number;
  email?: string; // Added email
}

export interface TariffRange {
  id: string;
  minMinutes: number;
  maxMinutes: number;
  price: number;
}

export interface Tariff {
  id: string;
  name: string;
  deviceType: DeviceType;
  ranges: TariffRange[];
}

export interface SessionItem {
  id: string;
  productId?: string; // Optional if custom
  name: string;
  price: number;
  quantity: number;
  timestamp: number;
}

export interface Session {
  id: string;
  startTime: number;
  customerId?: string;
  customerName?: string;
  type: SessionType;
  prepaidMinutes?: number; // Used for FIXED and FREE
  totalAmount?: number; // Pre-calculated amount for FIXED
  orders: SessionItem[]; // New: Items added to the account
}

export interface Station {
  id: string;
  name: string;
  type: DeviceType;
  status: StationStatus;
  currentSession?: Session;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number; // New: Costo de compra
  stock: number;
  // Changed from strictly 'SNACK' | 'DRINK' etc to string to allow custom categories
  category: string; 
  barcode?: string;
  distributor?: string;
  trackStock: boolean;
  hasWarranty: boolean;
  warrantyPeriod?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
  costAtSale?: number; // Historic cost for profit calculation
}

export interface Sale {
  id: string;
  timestamp: number;
  items: SaleItem[];
  total: number;
  type: 'POS' | 'RENTAL' | 'MANUAL_ENTRY' | 'STREAMING' | 'SERVICE'; // Added SERVICE
  paymentMethod: PaymentMethod;
  customerId?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  timestamp: number;
  category?: string;
  source?: 'CASH_REGISTER' | 'PROFIT'; // New field: CASH_REGISTER affects daily box, PROFIT only affects net distribution
}

export interface DashboardStats {
  totalSalesToday: number;
  activeStations: number;
  occupancyRate: number;
}

// --- NEW STREAMING TYPES ---

export interface StreamingDistributor {
  id: string;
  name: string;
  contactInfo?: string;
}

export interface StreamingPlatform {
  id: string;
  name: string;
  category: string; // e.g., 'Social streaming', 'Adultos', 'Familiar'
  suggestedPrice: number;
  cost: number;
}

export interface StreamingAccount {
  id: string;
  platformId: string;
  distributorId?: string;
  
  // Customer Info
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;

  // Account Credentials
  accountEmail: string;
  accountPassword?: string;
  profileName?: string;
  pin?: string;

  // Dates & Status
  purchaseDate: number;
  durationDays: number;
  expirationDate: number; // Timestamp
  
  // Financials
  price: number;
  cost: number;

  isAdult: boolean;
  isTrial: boolean;
  status: 'ACTIVE' | 'EXPIRED'; 
  notes?: string;
}

// --- NEW SERVICE ORDER TYPES ---

export enum OrderStatus {
  PENDING = 'PENDING',        // En Revisión
  APPROVED = 'APPROVED',      // Aprobado
  IN_PROGRESS = 'IN_PROGRESS',// En Reparación
  REPAIRED = 'REPAIRED',      // Reparado
  NOT_REPAIRED = 'NOT_REPAIRED', // No Reparado
  DELIVERED = 'DELIVERED',    // Entregado
  CANCELLED = 'CANCELLED'     // Cancelado
}

export interface ServiceOrder {
  id: string;
  folio: string; // Friendly ID like #001
  entryDate: number;
  
  // Customer
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;

  // Device
  deviceType: string;
  brand: string;
  model: string;
  serialNumber?: string;
  password?: string; // PIN/Pattern

  // Status & Diag
  problemDescription: string;
  technicalDiagnosis?: string;
  status: OrderStatus;
  technician?: string;

  // Financials
  estimatedCost: number;
  finalCost: number;
  advancePayment: number; // Anticipo

  // Other
  warranty?: string;
  notes?: string;
}

// --- DISTRIBUTION SETTINGS ---
export interface DistributionRule {
  id: string;
  name: string;
  percentage: number;
  color: string; // Tailwind color class helper
}

// --- BUSINESS SETTINGS ---
export interface BusinessSettings {
  name: string;
  address: string;
  website: string;
  whatsapp: string;
  footerMessage?: string;
  distributionRules?: DistributionRule[]; // New field
}

// --- BACKUP DATA STRUCTURE ---
export interface DatabaseBackup {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  tariffs: Tariff[];
  businessSettings: BusinessSettings;
  streamingAccounts: StreamingAccount[];
  streamingPlatforms: StreamingPlatform[];
  streamingDistributors: StreamingDistributor[];
  serviceOrders: ServiceOrder[];
  stations: Station[];
}