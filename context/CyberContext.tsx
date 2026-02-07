import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Station, Product, Sale, Tariff, StationStatus, Session, SaleItem, Customer, SessionType, SessionItem, PaymentMethod, Expense, StreamingAccount, StreamingPlatform, StreamingDistributor, ServiceOrder, BusinessSettings, DatabaseBackup, CashCut } from '../types';
import * as XLSX from 'xlsx';

// Define defaults locally to guarantee clean state on reset/init
const DEFAULT_CUSTOMERS: Customer[] = [{ id: 'public', name: 'Venta al Público', points: 0 }];
const DEFAULT_SETTINGS: BusinessSettings = {
    name: 'Mi Ciber',
    address: 'Dirección del Local',
    website: '',
    whatsapp: '',
    footerMessage: 'Gracias por su preferencia.',
    adminPin: '1234',
    distributionRules: [
        { id: '1', name: 'Reinversión', percentage: 40, color: 'text-blue-500' },
        { id: '2', name: 'Sueldos / Ganancia', percentage: 30, color: 'text-emerald-500' },
        { id: '3', name: 'Fondo de Ahorro', percentage: 30, color: 'text-purple-500' }
    ],
    depositDestinations: {
        pending: 'Cuenta Bancaria Principal',
        savings: 'Cuenta de Ahorro / Inversión',
        cogs: 'Cuenta de Recompra',
        cash: 'Caja Chica / Efectivo'
    }
};

interface CyberContextType {
  stations: Station[];
  products: Product[];
  tariffs: Tariff[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  businessSettings: BusinessSettings;
  
  // Auth State
  isAuthenticated: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  
  // Streaming Data
  streamingAccounts: StreamingAccount[];
  streamingPlatforms: StreamingPlatform[];
  streamingDistributors: StreamingDistributor[];

  // Service Orders Data
  serviceOrders: ServiceOrder[];

  // Cash Control
  cashCuts: CashCut[];
  activeCashCut: CashCut | undefined;
  openRegister: (initialAmount: number) => void;
  closeRegister: (declaredAmount: number, notes?: string) => void;
  updateCashCut: (cut: CashCut) => void; // New

  // Actions
  addStation: (station: Station) => void;
  updateStation: (station: Station) => void; 
  deleteStation: (id: string) => void;
  updateStationStatus: (id: string, status: StationStatus, session?: Session) => void;
  addOrderToSession: (stationId: string, item: Omit<SessionItem, 'id' | 'timestamp'>) => void;
  endSession: (stationId: string, paymentMethod: PaymentMethod, customerId?: string) => number; 
  addProduct: (product: Product) => void; 
  deleteProduct: (id: string) => void;
  updateProductStock: (id: string, quantity: number) => void; 
  recordSale: (items: SaleItem[], type: 'POS' | 'RENTAL' | 'MANUAL_ENTRY' | 'STREAMING' | 'SERVICE', paymentMethod: PaymentMethod, customerId?: string) => Sale;
  updateSale: (saleId: string, updates: Partial<Sale>) => void;
  deleteSale: (saleId: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void; 
  deleteExpense: (id: string) => void; 
  addTariff: (tariff: Tariff) => void;
  updateTariff: (tariff: Tariff) => void;
  deleteTariff: (id: string) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomerPoints: (id: string, points: number) => void;
  updateBusinessSettings: (settings: BusinessSettings) => void;

  // Streaming Actions
  addStreamingAccount: (account: StreamingAccount) => void;
  updateStreamingAccount: (account: StreamingAccount) => void;
  deleteStreamingAccount: (id: string) => void;
  addStreamingPlatform: (platform: StreamingPlatform) => void;
  updateStreamingPlatform: (platform: StreamingPlatform) => void;
  deleteStreamingPlatform: (id: string) => void;
  addStreamingDistributor: (dist: StreamingDistributor) => void;
  updateStreamingDistributor: (dist: StreamingDistributor) => void;
  deleteStreamingDistributor: (id: string) => void;

  // Service Order Actions
  addServiceOrder: (order: ServiceOrder) => void;
  updateServiceOrder: (order: ServiceOrder) => void;
  deleteServiceOrder: (id: string) => void;

  // Database Management
  importDatabase: (data: DatabaseBackup) => void;
  exportDatabase: () => void;
  resetDatabase: () => void;
}

const CyberContext = createContext<CyberContextType | undefined>(undefined);

export const CyberProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper to load safely
  const loadState = <T,>(key: string, fallback: T): T => {
      try {
          const saved = localStorage.getItem(key);
          if (saved) return JSON.parse(saved);
      } catch (e) {
          console.error(`Error loading ${key}`, e);
      }
      return fallback;
  };

  const [stations, setStations] = useState<Station[]>(() => loadState('stations', []));
  const [products, setProducts] = useState<Product[]>(() => loadState('products', []));
  const [tariffs, setTariffs] = useState<Tariff[]>(() => loadState('tariffs', []));
  const [sales, setSales] = useState<Sale[]>(() => loadState('sales', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadState('expenses', []));
  const [customers, setCustomers] = useState<Customer[]>(() => loadState('customers', DEFAULT_CUSTOMERS));
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => loadState('businessSettings', DEFAULT_SETTINGS));
  
  const [streamingAccounts, setStreamingAccounts] = useState<StreamingAccount[]>(() => loadState('streamingAccounts', []));
  const [streamingPlatforms, setStreamingPlatforms] = useState<StreamingPlatform[]>(() => loadState('streamingPlatforms', []));
  const [streamingDistributors, setStreamingDistributors] = useState<StreamingDistributor[]>(() => loadState('streamingDistributors', []));
  
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(() => loadState('serviceOrders', []));
  
  // NEW: Cash Cuts
  const [cashCuts, setCashCuts] = useState<CashCut[]>(() => loadState('cashCuts', []));

  // Persistence Effects with Error Handling
  const saveState = (key: string, value: any) => {
      try {
          localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
          console.error(`Error saving ${key}`, e);
          alert('Error: No se pueden guardar los datos. Verifique el almacenamiento de su navegador.');
      }
  };

  useEffect(() => saveState('stations', stations), [stations]);
  useEffect(() => saveState('products', products), [products]);
  useEffect(() => saveState('tariffs', tariffs), [tariffs]);
  useEffect(() => saveState('sales', sales), [sales]);
  useEffect(() => saveState('expenses', expenses), [expenses]);
  useEffect(() => saveState('customers', customers), [customers]);
  useEffect(() => saveState('businessSettings', businessSettings), [businessSettings]);
  
  useEffect(() => saveState('streamingAccounts', streamingAccounts), [streamingAccounts]);
  useEffect(() => saveState('streamingPlatforms', streamingPlatforms), [streamingPlatforms]);
  useEffect(() => saveState('streamingDistributors', streamingDistributors), [streamingDistributors]);
  
  useEffect(() => saveState('serviceOrders', serviceOrders), [serviceOrders]);
  useEffect(() => saveState('cashCuts', cashCuts), [cashCuts]);

  // Derived: Active Cut
  const activeCashCut = cashCuts.find(c => c.status === 'OPEN');

  // --- Auth Actions ---
  const login = (pin: string) => {
      // Allow '1234' as master override if settings are corrupted
      if (pin === businessSettings.adminPin || pin === '1234') {
          setIsAuthenticated(true);
          return true;
      }
      return false;
  };

  const logout = () => {
      setIsAuthenticated(false);
  };

  // --- Cash Control Actions ---
  const openRegister = (initialAmount: number) => {
      if (activeCashCut) return; // Already open
      const newCut: CashCut = {
          id: Date.now().toString(),
          startTime: Date.now(),
          initialCash: initialAmount,
          finalCashSystem: 0,
          finalCashDeclared: 0,
          difference: 0,
          totalSalesCash: 0,
          totalSalesCard: 0,
          totalSalesTransfer: 0,
          totalExpenses: 0,
          status: 'OPEN'
      };
      setCashCuts(prev => [newCut, ...prev]);
  };

  const closeRegister = (declaredAmount: number, notes?: string) => {
      if (!activeCashCut) return;

      const endTime = Date.now();
      
      // Calculate totals for this session timeframe
      const sessionSales = sales.filter(s => s.timestamp >= activeCashCut.startTime && s.timestamp <= endTime);
      const sessionExpenses = expenses.filter(e => e.timestamp >= activeCashCut.startTime && e.timestamp <= endTime);

      const totalSalesCash = sessionSales.filter(s => s.paymentMethod === 'CASH').reduce((a,b) => a + b.total, 0);
      const totalSalesCard = sessionSales.filter(s => s.paymentMethod === 'CARD' || s.paymentMethod === 'CLIP').reduce((a,b) => a + b.total, 0);
      const totalSalesTransfer = sessionSales.filter(s => s.paymentMethod === 'TRANSFER').reduce((a,b) => a + b.total, 0);
      
      const totalExpenses = sessionExpenses.reduce((a,b) => a + b.amount, 0);

      // System Cash = Initial + Sales(Cash) - Expenses
      const finalCashSystem = activeCashCut.initialCash + totalSalesCash - totalExpenses;
      const difference = declaredAmount - finalCashSystem;

      const closedCut: CashCut = {
          ...activeCashCut,
          endTime,
          finalCashSystem,
          finalCashDeclared: declaredAmount,
          difference,
          totalSalesCash,
          totalSalesCard,
          totalSalesTransfer,
          totalExpenses,
          status: 'CLOSED',
          notes
      };

      setCashCuts(prev => prev.map(c => c.id === activeCashCut.id ? closedCut : c));
  };

  const updateCashCut = (cut: CashCut) => {
      setCashCuts(prev => prev.map(c => c.id === cut.id ? cut : c));
  };

  const addStation = (station: Station) => setStations(prev => [...prev, station]);
  const updateStation = (updatedStation: Station) => setStations(prev => prev.map(s => s.id === updatedStation.id ? updatedStation : s));
  const deleteStation = (id: string) => setStations(prev => prev.filter(s => s.id !== id));
  
  const updateStationStatus = (id: string, status: StationStatus, session?: Session) => {
    setStations(prev => prev.map(s => s.id === id ? { ...s, status, currentSession: session } : s));
  };

  const addOrderToSession = (stationId: string, item: Omit<SessionItem, 'id' | 'timestamp'>) => {
      setStations(prev => prev.map(s => {
          if (s.id === stationId && s.currentSession) {
              const newItem: SessionItem = {
                  ...item,
                  id: Date.now().toString(),
                  timestamp: Date.now()
              };
              if (item.productId) updateProductStock(item.productId, -item.quantity);
              return {
                  ...s,
                  currentSession: {
                      ...s.currentSession,
                      orders: [...(s.currentSession.orders || []), newItem]
                  }
              };
          }
          return s;
      }));
  };

  const endSession = (stationId: string, paymentMethod: PaymentMethod, customerIdOverride?: string): number => {
    let rentalCost = 0;
    let productsCost = 0;
    const station = stations.find(s => s.id === stationId);
    
    if (station && station.currentSession) {
      const session = station.currentSession;
      const finalCustomerId = customerIdOverride || session.customerId || 'public';
      
      if (session.type === SessionType.FREE) {
        rentalCost = 0;
      } else if (session.type === SessionType.FIXED) {
         rentalCost = session.totalAmount || 0;
      } else {
        const durationMs = Date.now() - session.startTime;
        const totalMinutes = Math.ceil(durationMs / (1000 * 60));
        const specificTariff = station.tariffId ? tariffs.find(t => t.id === station.tariffId) : undefined;
        const typeTariff = tariffs.find(t => t.deviceType === station.type);
        const tariff = specificTariff || typeTariff || tariffs[0];
        
        if (tariff) {
            const hourlyRule = tariff.ranges.find(r => r.maxMinutes === 60) || tariff.ranges[tariff.ranges.length - 1];
            const hourlyPrice = hourlyRule ? hourlyRule.price : 0;
            const hours = Math.floor(totalMinutes / 60);
            const remainingMinutes = totalMinutes % 60;
            let remainderPrice = 0;
            if (remainingMinutes > 0) {
              const remainderRule = tariff.ranges.find(r => remainingMinutes >= r.minMinutes && remainingMinutes <= r.maxMinutes);
              if (remainderRule) {
                 remainderPrice = remainderRule.price;
              } else {
                 const fallbackRule = tariff.ranges.find(r => r.maxMinutes >= remainingMinutes);
                 remainderPrice = fallbackRule ? fallbackRule.price : (hourlyPrice * (remainingMinutes/60)); 
              }
            }
            rentalCost = (hours * hourlyPrice) + remainderPrice;
        } else {
            rentalCost = 0; 
        }
      }
      rentalCost = isNaN(rentalCost) ? 0 : rentalCost;

      if (session.orders) {
          productsCost = session.orders.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      }

      if (session.type !== SessionType.FREE && finalCustomerId !== 'public') {
          const durationMs = Date.now() - session.startTime;
          const hoursConsumed = Math.floor(durationMs / (1000 * 60 * 60));
          if (hoursConsumed > 0) updateCustomerPoints(finalCustomerId, hoursConsumed);
      }

      const saleItems: SaleItem[] = [];
      if (rentalCost > 0 || session.type === SessionType.FREE) {
        saleItems.push({
            productId: 'RENTAL',
            productName: `Renta ${station.name} (${session.type})`,
            quantity: 1,
            priceAtSale: rentalCost,
            costAtSale: 0
        });
      }
      if (session.orders) {
          session.orders.forEach(order => {
            const product = products.find(p => p.id === order.productId);
            saleItems.push({
                productId: order.productId || 'CUSTOM',
                productName: order.name,
                quantity: order.quantity,
                priceAtSale: order.price,
                costAtSale: product ? product.cost : 0
            });
          });
      }

      recordSale(saleItems, 'RENTAL', paymentMethod, finalCustomerId);
      updateStationStatus(stationId, StationStatus.AVAILABLE, undefined);
    }
    return rentalCost + productsCost;
  };

  const addProduct = (product: Product) => {
    setProducts(prev => {
        const index = prev.findIndex(p => p.id === product.id);
        if (index >= 0) {
            const newProducts = [...prev];
            newProducts[index] = product;
            return newProducts;
        } else {
            return [...prev, product];
        }
    });
  };

  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  const updateProductStock = (id: string, delta: number) => setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: p.stock + delta } : p));

  const recordSale = (items: SaleItem[], type: 'POS' | 'RENTAL' | 'MANUAL_ENTRY' | 'STREAMING' | 'SERVICE', paymentMethod: PaymentMethod, customerId: string = 'public'): Sale => {
    const itemsWithCost = items.map(item => {
        if (item.costAtSale !== undefined) return item;
        const product = products.find(p => p.id === item.productId);
        return {
            ...item,
            costAtSale: product ? product.cost : 0
        };
    });

    const total = itemsWithCost.reduce((acc, item) => acc + (item.priceAtSale * item.quantity), 0);
    const newSale: Sale = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      items: itemsWithCost,
      total,
      type,
      paymentMethod,
      customerId
    };
    setSales(prev => [newSale, ...prev]);

    if (type === 'POS') {
      items.forEach(item => updateProductStock(item.productId, -item.quantity));
    }
    return newSale;
  };

  const updateSale = (saleId: string, updates: Partial<Sale>) => setSales(prev => prev.map(s => s.id === saleId ? { ...s, ...updates } : s));
  const deleteSale = (saleId: string) => setSales(prev => prev.filter(s => s.id !== saleId));

  const addExpense = (expense: Omit<Expense, 'id' | 'timestamp'>) => {
    const newExpense: Expense = { ...expense, id: Date.now().toString(), timestamp: Date.now() };
    setExpenses(prev => [newExpense, ...prev]);
  };
  const updateExpense = (id: string, updates: Partial<Expense>) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  const deleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  const addTariff = (tariff: Tariff) => setTariffs([...tariffs, tariff]);
  const updateTariff = (updatedTariff: Tariff) => setTariffs(prev => prev.map(t => t.id === updatedTariff.id ? updatedTariff : t));
  const deleteTariff = (id: string) => setTariffs(prev => prev.filter(t => t.id !== id));

  const addCustomer = (customer: Customer) => setCustomers([...customers, customer]);
  const updateCustomerPoints = (id: string, delta: number) => setCustomers(prev => prev.map(c => c.id === id ? { ...c, points: c.points + delta } : c));
  const updateBusinessSettings = (settings: BusinessSettings) => setBusinessSettings(settings);

  // Streaming Actions
  const addStreamingAccount = (account: StreamingAccount) => {
      setStreamingAccounts(prev => [account, ...prev]);
      if (!account.isTrial) {
        const platform = streamingPlatforms.find(p => p.id === account.platformId);
        const saleItem: SaleItem = {
            productId: account.platformId,
            productName: platform ? `Streaming: ${platform.name}` : 'Cuenta Streaming',
            quantity: 1,
            priceAtSale: account.price,
            costAtSale: account.cost
        };
        recordSale([saleItem], 'STREAMING', 'CASH', account.customerId);
      }
  };
  const updateStreamingAccount = (account: StreamingAccount) => setStreamingAccounts(prev => prev.map(a => a.id === account.id ? account : a));
  const deleteStreamingAccount = (id: string) => setStreamingAccounts(prev => prev.filter(a => a.id !== id));
  
  const addStreamingPlatform = (platform: StreamingPlatform) => setStreamingPlatforms(prev => [...prev, platform]);
  const updateStreamingPlatform = (platform: StreamingPlatform) => setStreamingPlatforms(prev => prev.map(p => p.id === platform.id ? platform : p));
  const deleteStreamingPlatform = (id: string) => setStreamingPlatforms(prev => prev.filter(p => p.id !== id));

  const addStreamingDistributor = (dist: StreamingDistributor) => setStreamingDistributors(prev => [...prev, dist]);
  const updateStreamingDistributor = (dist: StreamingDistributor) => setStreamingDistributors(prev => prev.map(d => d.id === dist.id ? dist : d));
  const deleteStreamingDistributor = (id: string) => setStreamingDistributors(prev => prev.filter(d => d.id !== id));

  const addServiceOrder = (order: ServiceOrder) => setServiceOrders(prev => [order, ...prev]);
  const updateServiceOrder = (order: ServiceOrder) => setServiceOrders(prev => prev.map(o => o.id === order.id ? order : o));
  const deleteServiceOrder = (id: string) => setServiceOrders(prev => prev.filter(o => o.id !== id));

  // --- DATABASE OPS ---
  const importDatabase = (data: DatabaseBackup) => {
      if (data.products) setProducts(data.products);
      if (data.sales) setSales(data.sales);
      if (data.expenses) setExpenses(data.expenses);
      if (data.customers) setCustomers(data.customers);
      if (data.tariffs) setTariffs(data.tariffs);
      if (data.businessSettings) setBusinessSettings(data.businessSettings);
      if (data.streamingAccounts) setStreamingAccounts(data.streamingAccounts);
      if (data.streamingPlatforms) setStreamingPlatforms(data.streamingPlatforms);
      if (data.streamingDistributors) setStreamingDistributors(data.streamingDistributors);
      if (data.serviceOrders) setServiceOrders(data.serviceOrders);
      if (data.stations) setStations(data.stations);
      if (data.cashCuts) setCashCuts(data.cashCuts);
  };

  const exportDatabase = () => {
      const wb = XLSX.utils.book_new();
      const businessData = [{
          name: businessSettings.name,
          address: businessSettings.address,
          website: businessSettings.website,
          whatsapp: businessSettings.whatsapp,
          footerMessage: businessSettings.footerMessage,
          distributionRules: JSON.stringify(businessSettings.distributionRules)
      }];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(businessData), "Resumen");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sales.map(s => ({...s, items: JSON.stringify(s.items)}))), "Ventas");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products), "Productos");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses), "Gastos");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customers), "Clientes");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tariffs.map(t => ({...t, ranges: JSON.stringify(t.ranges)}))), "Tarifas");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stations.map(s => ({...s, currentSession: s.currentSession ? JSON.stringify(s.currentSession) : ''}))), "Estaciones");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(streamingAccounts), "CuentasStreaming");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(streamingPlatforms), "Plataformas");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(streamingDistributors), "Distribuidores");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(serviceOrders), "Reparaciones");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cashCuts), "CortesCaja");
      const dateStr = new Date().toISOString().slice(0,10);
      XLSX.writeFile(wb, `CyberManager_Respaldo_${dateStr}.xlsx`);
  };

  const resetDatabase = () => {
      // 1. Wipe everything from LocalStorage
      localStorage.clear();

      // 2. Clear state in memory immediately to update UI without waiting for reload
      setStations([]);
      setProducts([]);
      setTariffs([]);
      setSales([]);
      setExpenses([]);
      setCustomers(DEFAULT_CUSTOMERS);
      setBusinessSettings(DEFAULT_SETTINGS);
      setStreamingAccounts([]);
      setStreamingPlatforms([]);
      setStreamingDistributors([]);
      setServiceOrders([]);
      setCashCuts([]);

      // 3. Force Empty Writes to LocalStorage (Redundancy)
      localStorage.setItem('sales', '[]');
      localStorage.setItem('products', '[]');
      localStorage.setItem('stations', '[]');
      // ... and others

      // 4. Reload
      setTimeout(() => window.location.reload(), 500);
  };

  return (
    <CyberContext.Provider value={{
      stations, products, tariffs, sales, expenses, customers, businessSettings,
      streamingAccounts, streamingPlatforms, streamingDistributors, serviceOrders,
      isAuthenticated, login, logout,
      cashCuts, activeCashCut, openRegister, closeRegister, updateCashCut,
      addStation, updateStation, updateStationStatus, addOrderToSession, endSession, deleteStation,
      addProduct, updateProductStock, deleteProduct, recordSale, updateSale, deleteSale, addExpense, updateExpense, deleteExpense, 
      addTariff, updateTariff, deleteTariff,
      addCustomer, updateCustomerPoints, updateBusinessSettings,
      addStreamingAccount, updateStreamingAccount, deleteStreamingAccount,
      addStreamingPlatform, updateStreamingPlatform, deleteStreamingPlatform,
      addStreamingDistributor, updateStreamingDistributor, deleteStreamingDistributor,
      addServiceOrder, updateServiceOrder, deleteServiceOrder,
      importDatabase, exportDatabase, resetDatabase
    }}>
      {children}
    </CyberContext.Provider>
  );
};

export const useCyber = () => {
  const context = useContext(CyberContext);
  if (!context) throw new Error("useCyber must be used within a CyberProvider");
  return context;
};