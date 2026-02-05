import React, { useState, useEffect } from 'react';
import { useCyber } from '../context/CyberContext';
import { DollarSign, MonitorPlay, Users, TrendingUp, Monitor, Gamepad2, Play, Square, AlertCircle, Timer, ShoppingBag, Settings, PlusCircle, MinusCircle, Calendar } from 'lucide-react';
import { Station, StationStatus, DeviceType, Tariff, SessionType, PaymentMethod } from '../types';
import StartSessionModal from './StartSessionModal';
import AddProductToSessionModal from './AddProductToSessionModal';
import CheckoutModal from './CheckoutModal';
import StationSettingsModal from './StationSettingsModal';
import EntryModal from './EntryModal';
import ExpenseModal from './ExpenseModal';

// --- Subcomponent: Station Card ---
const StationCard: React.FC<{ station: Station; tariffs: Tariff[] }> = ({ station, tariffs }) => {
  const { updateStationStatus, endSession } = useCyber();
  const [elapsed, setElapsed] = useState(0);
  const [rentalCost, setRentalCost] = useState(0);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Calculate products total
  const productsTotal = station.currentSession?.orders?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const totalCost = rentalCost + productsTotal;

  useEffect(() => {
    let interval: any;
    if (station.status === StationStatus.OCCUPIED && station.currentSession) {
      const updateTimer = () => {
        const now = Date.now();
        const startTime = station.currentSession!.startTime;
        const ms = now - startTime;
        setElapsed(ms);

        // Cost Calculation Logic based on Type
        if (station.currentSession?.type === SessionType.FIXED) {
            setRentalCost(station.currentSession.totalAmount || 0);
        } else if (station.currentSession?.type === SessionType.FREE) {
            setRentalCost(0);
        } else {
             // OPEN TIME LOGIC
            const totalMinutes = Math.ceil(ms / (1000 * 60));
            const tariff = tariffs.find(t => t.deviceType === station.type) || tariffs[0];
            
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
            const estimatedCost = (hours * hourlyPrice) + remainderPrice;
            setRentalCost(isNaN(estimatedCost) ? 0 : estimatedCost);
        }
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsed(0);
      setRentalCost(0);
    }
    return () => clearInterval(interval);
  }, [station, tariffs]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
      if (!station.currentSession?.prepaidMinutes) return null;
      const endTime = station.currentSession.startTime + (station.currentSession.prepaidMinutes * 60 * 1000);
      const remaining = endTime - Date.now();
      return remaining > 0 ? formatTime(remaining) : "00:00:00";
  }

  const handleFinishSession = (method: PaymentMethod, customerId: string) => {
      endSession(station.id, method, customerId);
      setShowCheckout(false);
  };

  const getStatusClasses = () => {
    switch (station.status) {
      case StationStatus.AVAILABLE: 
        return 'glow-available bg-slate-800';
      case StationStatus.OCCUPIED: 
        return 'glow-occupied bg-rose-950/10';
      case StationStatus.MAINTENANCE: 
        return 'border-amber-500/50 bg-amber-950/10 hover:border-amber-500';
      default: 
        return 'border-slate-700 bg-slate-800';
    }
  };

  const Icon = station.type === DeviceType.PC ? Monitor : Gamepad2;

  return (
    <>
    <div className={`relative p-5 rounded-2xl border-2 transition-all duration-300 shadow-lg group ${getStatusClasses()}`}>
      
      <div className="flex justify-between items-start mb-4 pr-8">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg transition-colors duration-500 ${station.status === StationStatus.OCCUPIED ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-700 text-slate-400'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{station.name}</h3>
            <p className="text-xs text-slate-400 font-medium tracking-wide">{station.type}</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full mt-1 transition-all duration-500 ${
            station.status === StationStatus.AVAILABLE ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 
            station.status === StationStatus.OCCUPIED ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse' : 
            'bg-amber-500'
          }`} 
        />
      </div>

      <div className="space-y-4">
        {station.status === StationStatus.OCCUPIED ? (
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  {station.currentSession?.type === SessionType.OPEN ? 'Tiempo Transcurrido' : 'Tiempo Restante'}
              </span>
              <div className="flex items-center gap-1.5 text-blue-400 font-mono text-lg font-bold">
                <Timer className="w-4 h-4" />
                {station.currentSession?.type === SessionType.OPEN ? formatTime(elapsed) : getRemainingTime()}
              </div>
            </div>

            {/* Breakdown */}
            <div className="border-t border-slate-700/50 pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                    <span>Renta:</span>
                    <span>${rentalCost.toFixed(2)}</span>
                </div>
                {productsTotal > 0 && (
                     <div className="flex justify-between text-xs text-slate-400">
                        <span>Consumo:</span>
                        <span>${productsTotal.toFixed(2)}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-700 pt-2 mt-2">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total</span>
              <span className="text-emerald-400 font-bold text-xl">${totalCost.toFixed(2)}</span>
            </div>
            <div className="mt-2 text-xs text-center text-slate-500">
               {station.currentSession?.customerName}
            </div>
          </div>
        ) : (
          <div className="h-[106px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-xl bg-slate-900/20">
             <span className="text-sm">Disponible</span>
             {station.status === StationStatus.MAINTENANCE && <span className="text-amber-500 text-xs mt-1">En mantenimiento</span>}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          {station.status === StationStatus.AVAILABLE && (
            <button 
              onClick={() => setShowStartModal(true)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <Play className="w-4 h-4 fill-current" /> Iniciar
            </button>
          )}
          {station.status === StationStatus.OCCUPIED && (
             <div className="grid grid-cols-2 gap-2">
                 <button 
                    onClick={() => setShowProductModal(true)}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                    title="Vender Producto a la Cuenta"
                 >
                     <ShoppingBag className="w-4 h-4" /> Venta
                 </button>
                 <button 
                    onClick={() => setShowCheckout(true)}
                    className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                >
                    <Square className="w-4 h-4 fill-current" /> Finalizar
                </button>
             </div>
          )}
           {station.status === StationStatus.MAINTENANCE && (
             <button 
             onClick={() => updateStationStatus(station.id, StationStatus.AVAILABLE)}
             className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
           >
             <AlertCircle className="w-4 h-4" /> Habilitar
           </button>
          )}
        </div>
      </div>

      {/* Settings Button - Opens Modal */}
      <button 
          type="button"
          onClick={() => setShowSettingsModal(true)}
          className="absolute top-4 right-4 z-40 p-2 text-slate-500 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Configurar Equipo"
      >
          <Settings className="w-5 h-5" />
      </button>

    </div>
    {showStartModal && <StartSessionModal station={station} onClose={() => setShowStartModal(false)} />}
    {showProductModal && <AddProductToSessionModal station={station} onClose={() => setShowProductModal(false)} />}
    {showSettingsModal && <StationSettingsModal station={station} onClose={() => setShowSettingsModal(false)} />}
    {showCheckout && (
        <CheckoutModal 
            totalAmount={totalCost}
            defaultCustomerId={station.currentSession?.customerId}
            onCancel={() => setShowCheckout(false)}
            onConfirm={handleFinishSession}
            title={`Finalizar: ${station.name}`}
        />
    )}
    </>
  );
};

// --- Main Dashboard Component ---
const Dashboard: React.FC = () => {
  const { sales, stations, tariffs, addStation } = useCyber();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationType, setNewStationType] = useState<DeviceType>(DeviceType.PC);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // --- Logic for Sales Periods ---
  const now = new Date();
  
  // 1. Weekly Sales (Starts Saturday, Ends Friday)
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  // We calculate days passed since last Saturday. 
  // If Sat(6) -> 0 days. Sun(0) -> 1 day. Fri(5) -> 6 days.
  const daysSinceSaturday = (currentDay + 1) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysSinceSaturday);
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklySales = sales.filter(s => s.timestamp >= startOfWeek.getTime());
  const weeklyRevenue = weeklySales.reduce((acc, curr) => acc + curr.total, 0);

  // 2. Monthly Sales (Calendar Month)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const monthlySales = sales.filter(s => s.timestamp >= startOfMonth.getTime());
  const monthlyRevenue = monthlySales.reduce((acc, curr) => acc + curr.total, 0);

  // Format Dates for Display
  const monthName = now.toLocaleString('es-ES', { month: 'long' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStationName) {
      addStation({
        id: Date.now().toString(),
        name: newStationName,
        type: newStationType,
        status: StationStatus.AVAILABLE
      });
      setIsModalOpen(false);
      setNewStationName('');
    }
  };

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Weekly Sales Card */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Ventas Semana (Sáb-Vie)</p>
              <h3 className="text-3xl font-bold text-white mt-2">${weeklyRevenue.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-emerald-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Semana Actual</span>
          </div>
        </div>

        {/* Monthly Sales Card (Replaces Active Stations) */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Ventas del Mes</p>
              <h3 className="text-3xl font-bold text-white mt-2">${monthlyRevenue.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <div className="mt-4 text-slate-400 text-sm capitalize">
            {monthName} {now.getFullYear()}
          </div>
        </div>

        {/* Transactions Card */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Transacciones (Sem)</p>
              <h3 className="text-3xl font-bold text-white mt-2">{weeklySales.length}</h3>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <div className="mt-4 text-slate-400 text-sm">
            Promedio: ${(weeklyRevenue / (weeklySales.length || 1)).toFixed(1)}
          </div>
        </div>
      </div>

      <hr className="border-slate-700/50" />
      
      {/* Cash Flow Buttons */}
      <div className="flex gap-4">
        <button 
          onClick={() => setShowEntryModal(true)}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
        >
          <PlusCircle className="w-5 h-5" /> Nueva Entrada
        </button>
        <button 
          onClick={() => setShowExpenseModal(true)}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-rose-900/20 transition-all hover:scale-105"
        >
          <MinusCircle className="w-5 h-5" /> Nueva Salida
        </button>
      </div>

      {/* Station Control Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Control de Equipos</h2>
          <p className="text-slate-400 text-sm mt-1">Monitoreo en tiempo real de computadoras y consolas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/30 flex items-center gap-2"
        >
          + Nuevo Equipo
        </button>
      </div>

      {/* Station Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
        {stations.map(station => (
          <StationCard key={station.id} station={station} tariffs={tariffs} />
        ))}
      </div>

      {/* Modals */}
      {showEntryModal && <EntryModal onClose={() => setShowEntryModal(false)} />}
      {showExpenseModal && <ExpenseModal onClose={() => setShowExpenseModal(false)} />}

      {/* Modal for New Station */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Nuevo Equipo</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={newStationName}
                  onChange={e => setNewStationName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej. PC Gamer 04"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Tipo</label>
                <select 
                  value={newStationType}
                  onChange={e => setNewStationType(e.target.value as DeviceType)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.values(DeviceType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;