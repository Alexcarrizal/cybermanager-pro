import { Station, DeviceType, StationStatus, Product, Tariff, SessionType, Customer, StreamingPlatform, StreamingDistributor, StreamingAccount, ServiceOrder, OrderStatus, Sale, Expense } from './types';

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

export const INITIAL_TARIFFS: Tariff[] = [
  { 
    id: 't1', 
    name: 'PC General', 
    deviceType: DeviceType.PC,
    ranges: [
      { id: 'r1', minMinutes: 1, maxMinutes: 15, price: 10 },
      { id: 'r2', minMinutes: 16, maxMinutes: 30, price: 15 },
      { id: 'r3', minMinutes: 31, maxMinutes: 60, price: 20 },
      { id: 'r4', minMinutes: 61, maxMinutes: 120, price: 35 },
      { id: 'r5', minMinutes: 121, maxMinutes: 180, price: 50 },
    ]
  },
  { 
    id: 't2', 
    name: 'Consolas (Xbox/PS5)', 
    deviceType: DeviceType.XBOX,
    ranges: [
      { id: 'r4', minMinutes: 1, maxMinutes: 30, price: 20 },
      { id: 'r5', minMinutes: 31, maxMinutes: 60, price: 35 },
      { id: 'r6', minMinutes: 61, maxMinutes: 120, price: 60 },
    ]
  },
  { 
    id: 't3', 
    name: 'Nintendo Switch', 
    deviceType: DeviceType.NINTENDO,
    ranges: [
      { id: 'r7', minMinutes: 1, maxMinutes: 60, price: 40 },
    ]
  },
];

export const INITIAL_STATIONS: Station[] = [
  { id: 'pc1', name: 'PC-01 Gamer (RTX 3060)', type: DeviceType.PC, status: StationStatus.AVAILABLE },
  { id: 'pc2', name: 'PC-02 Gamer (RTX 3060)', type: DeviceType.PC, status: StationStatus.AVAILABLE },
  { id: 'pc3', name: 'PC-03 Standard', type: DeviceType.PC, status: StationStatus.OCCUPIED, currentSession: { id: 's1', startTime: NOW - (45 * 60 * 1000), customerName: 'Invitado', type: SessionType.OPEN, orders: [] } },
  { id: 'pc4', name: 'PC-04 Standard', type: DeviceType.PC, status: StationStatus.AVAILABLE },
  { id: 'xb1', name: 'Xbox Series X - 01', type: DeviceType.XBOX, status: StationStatus.OCCUPIED, currentSession: { id: 's2', startTime: NOW - (15 * 60 * 1000), customerName: 'Juan Pérez', customerId: 'c1', type: SessionType.FIXED, prepaidMinutes: 60, totalAmount: 35, orders: [] } },
  { id: 'xb2', name: 'Xbox Series S - 02', type: DeviceType.XBOX, status: StationStatus.AVAILABLE },
  { id: 'ps1', name: 'PlayStation 5 - 01', type: DeviceType.PS5, status: StationStatus.MAINTENANCE },
  { id: 'ns1', name: 'Nintendo Switch OLED', type: DeviceType.NINTENDO, status: StationStatus.AVAILABLE },
];

export const INITIAL_PRODUCTS: Product[] = [
  // Bebidas
  { id: 'p1', name: 'Coca Cola 600ml', price: 25, cost: 18, stock: 49, category: 'Bebidas', trackStock: true, hasWarranty: false },
  { id: 'p2', name: 'Pepsi 600ml', price: 24, cost: 17, stock: 24, category: 'Bebidas', trackStock: true, hasWarranty: false },
  { id: 'p3', name: 'Agua Ciel 1L', price: 18, cost: 10, stock: 30, category: 'Bebidas', trackStock: true, hasWarranty: false },
  { id: 'p4', name: 'Monster Energy', price: 45, cost: 32, stock: 12, category: 'Bebidas', trackStock: true, hasWarranty: false },
  // Botanas
  { id: 'p5', name: 'Sabritas Original 45g', price: 18, cost: 13, stock: 29, category: 'Botanas', trackStock: true, hasWarranty: false },
  { id: 'p6', name: 'Doritos Nacho 50g', price: 18, cost: 13, stock: 15, category: 'Botanas', trackStock: true, hasWarranty: false },
  { id: 'p7', name: 'Ruffles Queso', price: 18, cost: 13, stock: 8, category: 'Botanas', trackStock: true, hasWarranty: false },
  { id: 'p8', name: 'Maruchan Instantánea', price: 20, cost: 12, stock: 50, category: 'Botanas', trackStock: true, hasWarranty: false },
  // Servicios
  { id: 'p9', name: 'Impresión B/N (Carta)', price: 3, cost: 0.5, stock: 1000, category: 'Servicios', trackStock: false, hasWarranty: false },
  { id: 'p10', name: 'Impresión Color (Carta)', price: 10, cost: 2, stock: 500, category: 'Servicios', trackStock: false, hasWarranty: false },
  { id: 'p11', name: 'Escaneo de Documento', price: 5, cost: 0, stock: 999, category: 'Servicios', trackStock: false, hasWarranty: false },
  { id: 'p12', name: 'Copia B/N', price: 2, cost: 0.5, stock: 999, category: 'Servicios', trackStock: false, hasWarranty: false },
  // Accesorios
  { id: 'p13', name: 'Mouse Gamer RGB', price: 350, cost: 200, stock: 5, category: 'Accesorios', trackStock: true, hasWarranty: true, warrantyPeriod: '3 meses' },
  { id: 'p14', name: 'Audífonos Básicos', price: 120, cost: 60, stock: 10, category: 'Accesorios', trackStock: true, hasWarranty: true, warrantyPeriod: '1 mes' },
  { id: 'p15', name: 'Cable USB-C 1m', price: 80, cost: 30, stock: 20, category: 'Accesorios', trackStock: true, hasWarranty: true, warrantyPeriod: '1 mes' },
  { id: 'p16', name: 'Memoria USB 32GB', price: 150, cost: 90, stock: 15, category: 'Accesorios', trackStock: true, hasWarranty: true, warrantyPeriod: '6 meses' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'public', name: 'Venta al Público', points: 0 },
  { id: 'c1', name: 'Juan Pérez', phone: '5512345678', points: 125, email: 'juan.perez@email.com' },
  { id: 'c2', name: 'Maria García', phone: '5587654321', points: 40, email: 'maria.garcia@email.com' },
  { id: 'c3', name: 'Pedro López', phone: '5511223344', points: 10, email: 'pedro.lopez@email.com' },
  { id: 'c4', name: 'Ana Torres', phone: '5544332211', points: 250, email: 'ana.torres@email.com' },
  { id: 'c5', name: 'Carlos Ruiz', phone: '5599887766', points: 0, email: 'carlos.ruiz@email.com' },
];

export const INITIAL_PLATFORMS: StreamingPlatform[] = [
    { id: 'sp1', name: 'Netflix 4K Ultra', category: 'Premium', suggestedPrice: 180, cost: 120 },
    { id: 'sp2', name: 'Disney+ Premium', category: 'Familiar', suggestedPrice: 150, cost: 90 },
    { id: 'sp3', name: 'HBO Max', category: 'Entretenimiento', suggestedPrice: 120, cost: 70 },
    { id: 'sp4', name: 'Spotify Duo', category: 'Música', suggestedPrice: 100, cost: 50 },
    { id: 'sp5', name: 'Crunchyroll Fan', category: 'Anime', suggestedPrice: 90, cost: 40 },
    { id: 'sp6', name: 'YouTube Premium', category: 'Video', suggestedPrice: 130, cost: 80 },
];

export const INITIAL_DISTRIBUTORS: StreamingDistributor[] = [
    { id: 'sd1', name: 'Proveedor Directo' },
    { id: 'sd2', name: 'Reventa Digital Services' },
    { id: 'sd3', name: 'Global Keys' },
];

export const INITIAL_STREAMING_ACCOUNTS: StreamingAccount[] = [
    {
        id: 'sa1', platformId: 'sp1', customerId: 'c1', customerName: 'Juan Pérez', customerPhone: '5512345678', accountEmail: 'juan.netflix@mail.com', accountPassword: 'password123', profileName: 'Juan', pin: '1234',
        purchaseDate: NOW - (10 * DAY), durationDays: 30, expirationDate: NOW + (20 * DAY), price: 180, cost: 120, isAdult: false, isTrial: false, status: 'ACTIVE'
    },
    {
        id: 'sa2', platformId: 'sp2', customerId: 'c2', customerName: 'Maria García', customerPhone: '5587654321', accountEmail: 'maria.disney@mail.com', accountPassword: 'password123', profileName: 'Familia',
        purchaseDate: NOW - (28 * DAY), durationDays: 30, expirationDate: NOW + (2 * DAY), price: 150, cost: 90, isAdult: false, isTrial: false, status: 'ACTIVE'
    },
    {
        id: 'sa3', platformId: 'sp5', customerId: 'c3', customerName: 'Pedro López', customerPhone: '5511223344', accountEmail: 'pedro.anime@mail.com', accountPassword: 'password123',
        purchaseDate: NOW - (35 * DAY), durationDays: 30, expirationDate: NOW - (5 * DAY), price: 90, cost: 40, isAdult: false, isTrial: false, status: 'EXPIRED'
    },
    {
        id: 'sa4', platformId: 'sp3', customerId: 'c4', customerName: 'Ana Torres', customerPhone: '5544332211', accountEmail: 'ana.hbo@mail.com', accountPassword: 'password123',
        purchaseDate: NOW - (1 * DAY), durationDays: 30, expirationDate: NOW + (29 * DAY), price: 120, cost: 70, isAdult: false, isTrial: false, status: 'ACTIVE'
    }
];

export const INITIAL_SERVICE_ORDERS: ServiceOrder[] = [
    {
        id: 'so1', folio: '#0001', entryDate: NOW - (5 * DAY), customerId: 'c4', customerName: 'Ana Torres', customerPhone: '5544332211',
        deviceType: 'Laptop', brand: 'HP', model: 'Pavilion 15', serialNumber: 'CND12345',
        problemDescription: 'Pantalla azul al iniciar, se calienta mucho.',
        technicalDiagnosis: 'Mantenimiento general y cambio de pasta térmica. Reinstalación de sistema operativo.',
        status: OrderStatus.DELIVERED,
        estimatedCost: 800, finalCost: 800, advancePayment: 200, technician: 'Técnico Principal', warranty: '30 días en software'
    },
    {
        id: 'so2', folio: '#0002', entryDate: NOW - (3 * DAY), customerId: 'c1', customerName: 'Juan Pérez', customerPhone: '5512345678',
        deviceType: 'Consola', brand: 'Microsoft', model: 'Xbox Series S',
        problemDescription: 'No da imagen en HDMI. El puerto se ve dañado.',
        status: OrderStatus.IN_PROGRESS,
        estimatedCost: 1200, finalCost: 0, advancePayment: 500, technician: 'Técnico Principal'
    },
    {
        id: 'so3', folio: '#0003', entryDate: NOW - (1 * DAY), customerId: 'public', customerName: 'Cliente Casual', customerPhone: '5500000000',
        deviceType: 'PC Escritorio', brand: 'Genérica', model: 'Gamer',
        problemDescription: 'Limpieza profunda y acomodo de cables.',
        status: OrderStatus.PENDING,
        estimatedCost: 350, finalCost: 0, advancePayment: 0
    },
    {
        id: 'so4', folio: '#0004', entryDate: NOW - (2 * 60 * 60 * 1000), customerId: 'c2', customerName: 'Maria García', customerPhone: '5587654321',
        deviceType: 'Celular', brand: 'Samsung', model: 'A52',
        problemDescription: 'Cambio de centro de carga.',
        status: OrderStatus.APPROVED,
        estimatedCost: 450, finalCost: 0, advancePayment: 0
    }
];

export const INITIAL_EXPENSES: Expense[] = [
    { id: 'e1', description: 'Pago de Internet Fibra', amount: 800, timestamp: NOW - (15 * DAY) },
    { id: 'e2', description: 'Compra de Refrescos Coca-Cola', amount: 1200, timestamp: NOW - (3 * DAY) },
    { id: 'e3', description: 'Artículos de Limpieza', amount: 150, timestamp: NOW - (1 * DAY) },
    { id: 'e4', description: 'Pago de Luz (Parcial)', amount: 500, timestamp: NOW - (2 * DAY) },
];

export const INITIAL_SALES: Sale[] = [
    // Today
    { id: 's1', timestamp: NOW - (1 * 60 * 60 * 1000), total: 45, items: [{ productId: 'p1', productName: 'Coca Cola 600ml', quantity: 1, priceAtSale: 25 }, { productId: 'p8', productName: 'Maruchan', quantity: 1, priceAtSale: 20 }], type: 'POS', paymentMethod: 'CASH', customerId: 'public' },
    { id: 's2', timestamp: NOW - (3 * 60 * 60 * 1000), total: 35, items: [{ productId: 'RENTAL', productName: 'Renta PC-01 (30 min)', quantity: 1, priceAtSale: 15 }, { productId: 'p5', productName: 'Sabritas', quantity: 1, priceAtSale: 20 }], type: 'RENTAL', paymentMethod: 'CASH', customerId: 'c1' },
    // Yesterday
    { id: 's3', timestamp: NOW - DAY - (4 * 60 * 60 * 1000), total: 150, items: [{ productId: 'sp2', productName: 'Streaming: Disney+ Premium', quantity: 1, priceAtSale: 150 }], type: 'STREAMING', paymentMethod: 'TRANSFER', customerId: 'c2' },
    { id: 's4', timestamp: NOW - DAY - (2 * 60 * 60 * 1000), total: 200, items: [{ productId: 'MANUAL', productName: 'Servicio Impresión Tesis (100 hojas)', quantity: 1, priceAtSale: 200 }], type: 'SERVICE', paymentMethod: 'CASH', customerId: 'public' },
    { id: 's5', timestamp: NOW - DAY - (6 * 60 * 60 * 1000), total: 120, items: [{ productId: 'sa4', productName: 'Streaming: HBO Max', quantity: 1, priceAtSale: 120 }], type: 'STREAMING', paymentMethod: 'CASH', customerId: 'c4' },
    // 2 Days ago
    { id: 's6', timestamp: NOW - (2*DAY), total: 500, items: [{ productId: 'so1', productName: 'Anticipo Reparación #0002', quantity: 1, priceAtSale: 500 }], type: 'SERVICE', paymentMethod: 'CARD', customerId: 'c1' },
    { id: 's7', timestamp: NOW - (2*DAY) - (200000), total: 50, items: [{ productId: 'RENTAL', productName: 'Renta Xbox (1hr)', quantity: 1, priceAtSale: 35 }, { productId: 'p1', productName: 'Coca Cola', quantity: 1, priceAtSale: 15 }], type: 'RENTAL', paymentMethod: 'CASH', customerId: 'public' },
    // 3 Days ago
    { id: 's8', timestamp: NOW - (3*DAY), total: 180, items: [{ productId: 'sa1', productName: 'Streaming: Netflix 4K', quantity: 1, priceAtSale: 180 }], type: 'STREAMING', paymentMethod: 'CASH', customerId: 'c1' },
];