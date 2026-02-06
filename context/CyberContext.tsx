import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Station, Product, Sale, Tariff, StationStatus, Session, SaleItem, Customer, SessionType, SessionItem, PaymentMethod, Expense, StreamingAccount, StreamingPlatform, StreamingDistributor, ServiceOrder, OrderStatus, BusinessSettings, DatabaseBackup } from '../types';
import { 
  INITIAL_STATIONS, 
  INITIAL_PRODUCTS, 
  INITIAL_TARIFFS, 
  INITIAL_CUSTOMERS, 
  INITIAL_PLATFORMS, 
  INITIAL_DISTRIBUTORS,
  INITIAL_STREAMING_ACCOUNTS,
  INITIAL_SERVICE_ORDERS,
  INITIAL_SALES,
  INITIAL_EXPENSES
} from '../constants';
import * as XLSX from 'xlsx';

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
  updateExpense: (id: string, updates: Partial<Expense>) => void; // New
  deleteExpense: (id: string) => void; // New
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
  // Auth State (Session based, not persisted in localstorage for security in this context)
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize from LocalStorage or Defaults
  const [stations, setStations] = useState<Station[]>(() => {
    const saved = localStorage.getItem('stations');
    return saved ? JSON.parse(saved) : INITIAL_STATIONS;
  });
  
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [tariffs, setTariffs] = useState<Tariff[]>(() => {
    const saved = localStorage.getItem('tariffs');
    return saved ? JSON.parse(saved) : INITIAL_TARIFFS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem('businessSettings');
    const defaultSettings: BusinessSettings = {
        name: 'Mi Ciber',
        address: 'Dirección del Local',
        website: '',
        whatsapp: '',
        footerMessage: 'Gracias por su preferencia.',
        adminPin: '1234', // Default PIN
        // Default Distribution Rules
        distributionRules: [
            { id: '1', name: 'Reinversión', percentage: 40, color: 'text-blue-500' },
            { id: '2', name: 'Sueldos / Ganancia', percentage: 30, color: 'text-emerald-500' },
            { id: '3', name: 'Fondo de Ahorro', percentage: 30, color: 'text-purple-500' }
        ]
    };
    
    if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure distribution rules exist if loading old data
        if (!parsed.distributionRules) {
            parsed.distributionRules = defaultSettings.distributionRules;
        }
        // Ensure adminPin exists if loading old data
        if (!parsed.adminPin) {
            parsed.adminPin = '1234';
        }
        return parsed;
    }
    return defaultSettings;
  });

  // Streaming State
  const [streamingAccounts, setStreamingAccounts] = useState<StreamingAccount[]>(() => {
    const saved = localStorage.getItem('streamingAccounts');
    return saved ? JSON.parse(saved) : INITIAL_STREAMING_ACCOUNTS;
  });

  const [streamingPlatforms, setStreamingPlatforms] = useState<StreamingPlatform[]>(() => {
    const saved = localStorage.getItem('streamingPlatforms');
    return saved ? JSON.parse(saved) : INITIAL_PLATFORMS;
  });

  const [streamingDistributors, setStreamingDistributors] = useState<StreamingDistributor[]>(() => {
    const saved = localStorage.getItem('streamingDistributors');
    return saved ? JSON.parse(saved) : INITIAL_DISTRIBUTORS;
  });

  // Service Orders State
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem('serviceOrders');
    return saved ? JSON.parse(saved) : INITIAL_SERVICE_ORDERS;
  });

  // Persistence Effects
  useEffect(() => localStorage.setItem('stations', JSON.stringify(stations)), [stations]);
  useEffect(() => localStorage.setItem('products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('tariffs', JSON.stringify(tariffs)), [tariffs]);
  useEffect(() => localStorage.setItem('sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('customers', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('businessSettings', JSON.stringify(businessSettings)), [businessSettings]);
  
  useEffect(() => localStorage.setItem('streamingAccounts', JSON.stringify(streamingAccounts)), [streamingAccounts]);
  useEffect(() => localStorage.setItem('streamingPlatforms', JSON.stringify(streamingPlatforms)), [streamingPlatforms]);
  useEffect(() => localStorage.setItem('streamingDistributors', JSON.stringify(streamingDistributors)), [streamingDistributors]);
  
  useEffect(() => localStorage.setItem('serviceOrders', JSON.stringify(serviceOrders)), [serviceOrders]);

  // --- Auth Actions ---
  const login = (pin: string) => {
      if (pin === businessSettings.adminPin) {
          setIsAuthenticated(true);
          return true;
      }
      return false;
  };

  const logout = () => {
      setIsAuthenticated(false);
  };

  const addStation = (station: Station) => setStations([...stations, station]);

  const updateStation = (updatedStation: Station) => {
    setStations(prev => prev.map(s => s.id === updatedStation.id ? updatedStation : s));
  };

  const deleteStation = (id: string) => {
    setStations(prev => prev.filter(s => s.id !== id));
  };
  
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
              
              if (item.productId) {
                  updateProductStock(item.productId, -item.quantity);
              }

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
      
      // 1. Calculate Time Cost
      if (session.type === SessionType.FREE) {
        rentalCost = 0;
      } 
      else if (session.type === SessionType.FIXED) {
         rentalCost = session.totalAmount || 0;
      }
      else {
        // OPEN
        const durationMs = Date.now() - session.startTime;
        const totalMinutes = Math.ceil(durationMs / (1000 * 60));
        
        // Find Tariff: Priority to specific tariffId, fallback to deviceType
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
            rentalCost = 0; // No tariff found
        }
      }

      rentalCost = isNaN(rentalCost) ? 0 : rentalCost;

      // 2. Calculate Products Cost
      if (session.orders) {
          productsCost = session.orders.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      }

      // 3. Loyalty Logic
      if (session.type !== SessionType.FREE && finalCustomerId !== 'public') {
          const durationMs = Date.now() - session.startTime;
          const hoursConsumed = Math.floor(durationMs / (1000 * 60 * 60));
          if (hoursConsumed > 0) {
             updateCustomerPoints(finalCustomerId, hoursConsumed);
          }
      }

      // 4. Record Sale
      const saleItems: SaleItem[] = [];
      
      if (rentalCost > 0 || session.type === SessionType.FREE) {
        saleItems.push({
            productId: 'RENTAL',
            productName: `Renta ${station.name} (${session.type})`,
            quantity: 1,
            priceAtSale: rentalCost,
            costAtSale: 0 // Rental has no direct COGS in this model
        });
      }

      if (session.orders) {
          session.orders.forEach(order => {
            // Find original product to get cost
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

  const deleteProduct = (id: string) => {
      setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProductStock = (id: string, delta: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: p.stock + delta } : p));
  };

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

  const updateSale = (saleId: string, updates: Partial<Sale>) => {
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, ...updates } : s));
  };

  const deleteSale = (saleId: string) => {
      setSales(prev => prev.filter(s => s.id !== saleId));
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'timestamp'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addTariff = (tariff: Tariff) => setTariffs([...tariffs, tariff]);
  
  const updateTariff = (updatedTariff: Tariff) => {
    setTariffs(prev => prev.map(t => t.id === updatedTariff.id ? updatedTariff : t));
  };

  const deleteTariff = (id: string) => {
      setTariffs(prev => prev.filter(t => t.id !== id));
  };

  const addCustomer = (customer: Customer) => setCustomers([...customers, customer]);

  const updateCustomerPoints = (id: string, delta: number) => {
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, points: c.points + delta } : c));
  };

  const updateBusinessSettings = (settings: BusinessSettings) => {
      setBusinessSettings(settings);
  };

  // --- STREAMING ACTIONS ---
  
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

  const updateStreamingAccount = (account: StreamingAccount) => {
      setStreamingAccounts(prev => prev.map(a => a.id === account.id ? account : a));
  };

  const deleteStreamingAccount = (id: string) => {
      setStreamingAccounts(prev => prev.filter(a => a.id !== id));
  };

  const addStreamingPlatform = (platform: StreamingPlatform) => setStreamingPlatforms(prev => [...prev, platform]);
  const updateStreamingPlatform = (platform: StreamingPlatform) => setStreamingPlatforms(prev => prev.map(p => p.id === platform.id ? platform : p));
  const deleteStreamingPlatform = (id: string) => setStreamingPlatforms(prev => prev.filter(p => p.id !== id));

  const addStreamingDistributor = (dist: StreamingDistributor) => setStreamingDistributors(prev => [...prev, dist]);
  const updateStreamingDistributor = (dist: StreamingDistributor) => setStreamingDistributors(prev => prev.map(d => d.id === dist.id ? dist : d));
  const deleteStreamingDistributor = (id: string) => setStreamingDistributors(prev => prev.filter(d => d.id !== id));

  // --- SERVICE ORDER ACTIONS ---

  const addServiceOrder = (order: ServiceOrder) => {
    setServiceOrders(prev => [order, ...prev]);
  };

  const updateServiceOrder = (order: ServiceOrder) => {
    setServiceOrders(prev => prev.map(o => o.id === order.id ? order : o));
  };

  const deleteServiceOrder = (id: string) => {
    setServiceOrders(prev => prev.filter(o => o.id !== id));
  };

  // --- IMPORT/EXPORT DATABASE ---
  
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
  };

  const exportDatabase = () => {
      const wb = XLSX.utils.book_new();

      // 1. Business Info (Flattened)
      const businessData = [{
          name: businessSettings.name,
          address: businessSettings.address,
          website: businessSettings.website,
          whatsapp: businessSettings.whatsapp,
          footerMessage: businessSettings.footerMessage,
          distributionRules: JSON.stringify(businessSettings.distributionRules) // Flatten complex object
      }];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(businessData), "Resumen");

      // 2. Sales (Flatten nested items)
      const salesData = sales.map(s => ({
          ...s,
          items: JSON.stringify(s.items) // Convert array to string for Excel
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesData), "Ventas");

      // 3. Products
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products), "Productos");

      // 4. Expenses
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses), "Gastos");

      // 5. Customers
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customers), "Clientes");

      // 6. Tariffs (Flatten ranges)
      const tariffsData = tariffs.map(t => ({
          ...t,
          ranges: JSON.stringify(t.ranges)
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tariffsData), "Tarifas");

      // 7. Stations (Flatten currentSession)
      const stationsData = stations.map(s => ({
          ...s,
          currentSession: s.currentSession ? JSON.stringify(s.currentSession) : ''
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stationsData), "Estaciones");

      // 8. Streaming
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(streamingAccounts), "CuentasStreaming");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(streamingPlatforms), "Plataformas");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(streamingDistributors), "Distribuidores");

      // 9. Service Orders
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(serviceOrders), "Reparaciones");

      // Write file
      const dateStr = new Date().toISOString().slice(0,10);
      XLSX.writeFile(wb, `CyberManager_Respaldo_${dateStr}.xlsx`);
  };

  const resetDatabase = () => {
      // 1. Wipe everything from LocalStorage
      localStorage.clear();

      // 2. Explicitly write empty arrays to keys to prevent any ghost data on reload
      localStorage.setItem('sales', '[]');
      localStorage.setItem('stations', '[]');
      localStorage.setItem('products', '[]');
      localStorage.setItem('tariffs', '[]');
      localStorage.setItem('expenses', '[]');
      localStorage.setItem('customers', JSON.stringify(INITIAL_CUSTOMERS));
      localStorage.setItem('streamingAccounts', '[]');
      localStorage.setItem('serviceOrders', '[]');

      // 3. Force reload. 
      // Do NOT set state here, as it might trigger useEffects that write back current (dirty) state before reload.
      window.location.reload();
  };


  return (
    <CyberContext.Provider value={{
      stations, products, tariffs, sales, expenses, customers, businessSettings,
      streamingAccounts, streamingPlatforms, streamingDistributors,
      serviceOrders,
      isAuthenticated, login, logout,
      addStation, updateStation, updateStationStatus, addOrderToSession, endSession, deleteStation,
      addProduct, updateProductStock, deleteProduct, recordSale, updateSale, deleteSale, addExpense, updateExpense, deleteExpense, addTariff, updateTariff, deleteTariff,
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