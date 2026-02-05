import React, { useState, useEffect } from 'react';
import { useCyber } from '../context/CyberContext';
import { Station, StationStatus, DeviceType, Tariff, SessionType, PaymentMethod } from '../types';
import { Monitor, Gamepad2, Play, Square, AlertCircle, Timer, ShoppingBag, Settings } from 'lucide-react';
import StartSessionModal from './StartSessionModal';
import AddProductToSessionModal from './AddProductToSessionModal';
import CheckoutModal from './CheckoutModal';
import StationSettingsModal from './StationSettingsModal';

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

  // Timer effect
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
            const tariff = tariffs.find(t => t.deviceType === station.type) || tariffs[0];
            
            if (tariff) {
                const hourlyRule = tariff.ranges.find(r => r.maxMinutes === 60) || tariff.ranges[tariff.ranges.length - 1];
                const hourlyPrice = hourlyRule ? hourlyRule.price : 0;
                
                const hours = Math.floor(Math.ceil(ms / (1000 * 60)) / 60);
                const totalMinutes = Math.ceil(ms / (1000 * 60));
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
            } else {
                setRentalCost(0);
            }
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

      {/* Settings Button */}
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

const StationManager: React.FC = () => {
    const { stations, tariffs } = useCyber();

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                    <Monitor className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white">Gestión de Equipos</h2>
                    <p className="text-slate-400">Control de sesiones de PCs y Consolas</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stations.map(station => (
                    <StationCard key={station.id} station={station} tariffs={tariffs} />
                ))}
            </div>
        </div>
    );
};

export default StationManager;