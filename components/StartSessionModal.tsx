import React, { useState, useEffect } from 'react';
import { Station, Customer, Tariff, SessionType, Session, StationStatus, DeviceType } from '../types';
import { useCyber } from '../context/CyberContext';
import { X, Clock, Play, Gift, Plus, Star, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StartSessionModalProps {
  station: Station;
  onClose: () => void;
}

const StartSessionModal: React.FC<StartSessionModalProps> = ({ station, onClose }) => {
  const { customers, tariffs, updateStationStatus, updateCustomerPoints, addCustomer } = useCyber();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('public');
  const [sessionType, setSessionType] = useState<SessionType>(SessionType.OPEN);
  const [prepaidMinutes, setPrepaidMinutes] = useState<number>(60); // Default 1 hour
  const [freeHours, setFreeHours] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  
  // Find Tariff: Priority to specific tariffId, fallback to deviceType
  const specificTariff = station.tariffId ? tariffs.find(t => t.id === station.tariffId) : undefined;
  const typeTariff = tariffs.find(t => t.deviceType === station.type);
  const stationTariff = specificTariff || typeTariff || tariffs[0];

  // Logic to calculate price for Fixed Time
  const calculateFixedPrice = (minutes: number) => {
      if (!stationTariff) return 0;

      const hourlyRule = stationTariff.ranges.find(r => r.maxMinutes === 60) || stationTariff.ranges[stationTariff.ranges.length - 1];
      const hourlyPrice = hourlyRule ? hourlyRule.price : 0;

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      let remainderPrice = 0;
      if (remainingMinutes > 0) {
        const remainderRule = stationTariff.ranges.find(r => remainingMinutes >= r.minMinutes && remainingMinutes <= r.maxMinutes);
        if (remainderRule) {
             remainderPrice = remainderRule.price;
        } else {
             const fallbackRule = stationTariff.ranges.find(r => r.maxMinutes >= remainingMinutes);
             remainderPrice = fallbackRule ? fallbackRule.price : (hourlyPrice * (remainingMinutes/60)); 
        }
      }
      return (hours * hourlyPrice) + remainderPrice;
  };

  const handleStart = () => {
    let sessionData: Session = {
        id: Date.now().toString(),
        startTime: Date.now(),
        customerId: selectedCustomerId,
        customerName: selectedCustomer.name,
        type: sessionType,
        orders: []
    };

    if (sessionType === SessionType.FIXED) {
        sessionData.prepaidMinutes = prepaidMinutes;
        sessionData.totalAmount = calculateFixedPrice(prepaidMinutes);
    } else if (sessionType === SessionType.FREE) {
        sessionData.prepaidMinutes = freeHours * 60;
        sessionData.totalAmount = 0;
        // Deduct points immediately
        if (selectedCustomer.id !== 'public') {
            updateCustomerPoints(selectedCustomer.id, -(freeHours * 10));
        }
    }

    updateStationStatus(station.id, StationStatus.OCCUPIED, sessionData);
    onClose();
  };

  const handleRegisterClient = () => {
      const name = prompt("Nombre del cliente:");
      if (name) {
          const newCustomer: Customer = {
              id: Date.now().toString(),
              name,
              points: 0
          };
          addCustomer(newCustomer);
          setSelectedCustomerId(newCustomer.id);
      }
  };

  // Derived state values
  const currentPrice = sessionType === SessionType.FIXED ? calculateFixedPrice(prepaidMinutes) : 0;
  const pointsAvailable = selectedCustomer.points;
  const maxFreeHours = Math.floor(pointsAvailable / 10);
  
  // Handlers for dropdowns
  const availableFixedTimes = [
      { label: '30 minutos', val: 30 },
      { label: '1 hora', val: 60 },
      { label: '2 horas', val: 120 },
      { label: '3 horas', val: 180 },
      { label: '5 horas', val: 300 },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-lg rounded-2xl overflow-hidden border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header - Changed to Emerald Green to distinguish from Settings */}
        <div className="bg-emerald-600 p-4 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Play className="w-5 h-5 fill-current" /> Iniciar Sesión
                </h2>
                <p className="text-emerald-100 text-sm">
                    {station.name} 
                    {stationTariff ? ` • Tarifa: ${stationTariff.name}` : ''}
                </p>
            </div>
            <button onClick={onClose} className="text-emerald-100 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Warning if no tariffs */}
            {!stationTariff && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" />
                    <div>
                        <p className="text-sm text-rose-300 font-bold">¡Atención!</p>
                        <p className="text-xs text-rose-200/80">
                            No hay tarifas configuradas para este equipo. 
                            El costo calculado será $0.00.
                            <Link to="/settings" className="underline ml-1 text-white" onClick={onClose}>Ir a Configuración</Link>
                        </p>
                    </div>
                </div>
            )}

            {/* Clock Box */}
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Hora de Entrada</p>
                <div className="text-4xl font-bold text-white font-mono tracking-tight">
                    {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-slate-400 text-sm mt-1 capitalize">
                    {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* Customer Section */}
            <div>
                <div className="flex justify-between items-end mb-1">
                    <label className="text-sm font-medium text-slate-300">Cliente (Opcional)</label>
                </div>
                <select 
                    value={selectedCustomerId}
                    onChange={(e) => {
                        setSelectedCustomerId(e.target.value);
                        setSessionType(SessionType.OPEN); // Reset type on change
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.name} {c.points > 0 ? `(${c.points} puntos)` : ''}
                        </option>
                    ))}
                </select>
                <button 
                    onClick={handleRegisterClient}
                    className="w-full mt-2 py-2 border border-dashed border-slate-600 rounded-lg text-slate-400 text-sm hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Registrar Nuevo Cliente
                </button>
            </div>

            {/* Loyalty Box (Conditional) */}
            {selectedCustomer.id !== 'public' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2 text-amber-500 font-bold">
                        <Star className="w-5 h-5 fill-current" /> Puntos de Lealtad
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-slate-300">Puntos actuales:</span>
                        <span className="text-white font-bold">{pointsAvailable}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-300">Horas gratis disponibles:</span>
                        <span className="text-white font-bold">{Math.floor(pointsAvailable / 10)}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs text-amber-500/80 text-center">
                        1 punto por cada hora consumida • 10 puntos = 1 hora gratis
                    </div>
                </div>
            )}

            {/* Session Type Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Sesión</label>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setSessionType(SessionType.OPEN)}
                        className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                            sessionType === SessionType.OPEN 
                            ? 'bg-blue-600/20 border-blue-500 text-white' 
                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                        }`}
                    >
                        <Clock className="w-5 h-5 mb-1" />
                        <span className="font-bold text-sm">Tiempo Libre</span>
                        <span className="text-[10px] opacity-70">Cronómetro ascendente</span>
                    </button>

                    <button
                        onClick={() => setSessionType(SessionType.FIXED)}
                        className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                            sessionType === SessionType.FIXED
                            ? 'bg-purple-600/20 border-purple-500 text-white' 
                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                        }`}
                    >
                        <div className="relative">
                            <span className="absolute -top-1 -right-2 text-[10px] font-mono">|</span>
                            <span className="font-mono text-sm">¢</span>
                        </div>
                        <span className="font-bold text-sm">Tiempo Fijo</span>
                        <span className="text-[10px] opacity-70">Cuenta regresiva</span>
                    </button>

                    <button
                        onClick={() => setSessionType(SessionType.FREE)}
                        disabled={maxFreeHours === 0}
                        className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                            sessionType === SessionType.FREE
                            ? 'bg-emerald-600/20 border-emerald-500 text-white' 
                            : maxFreeHours === 0 
                                ? 'bg-slate-800/50 border-slate-700 text-slate-600 cursor-not-allowed'
                                : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                        }`}
                    >
                        <Gift className="w-5 h-5 mb-1" />
                        <span className="font-bold text-sm">Horas Gratis</span>
                        <span className="text-[10px] opacity-70">
                            {maxFreeHours === 0 ? 'No hay puntos suficientes' : 'Canjear puntos'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Dynamic Content based on Type */}
            {sessionType === SessionType.FIXED && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-purple-200 mb-2">Tiempo Prepagado</label>
                    <select 
                        value={prepaidMinutes}
                        onChange={(e) => setPrepaidMinutes(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-purple-500/50 rounded-lg p-3 text-white outline-none"
                    >
                        {availableFixedTimes.map(t => (
                            <option key={t.val} value={t.val}>{t.label}</option>
                        ))}
                    </select>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-purple-500/20">
                        <span className="text-purple-200 font-bold">Total a cobrar:</span>
                        <span className="text-xl font-bold text-white">${currentPrice.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {sessionType === SessionType.FREE && (
                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-emerald-200 mb-2">Horas Gratis a Canjear</label>
                    <select 
                        value={freeHours}
                        onChange={(e) => setFreeHours(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg p-3 text-white outline-none"
                    >
                        {Array.from({ length: maxFreeHours }, (_, i) => i + 1).map(h => (
                            <option key={h} value={h}>{h} hora{h > 1 ? 's' : ''} ({h * 10} puntos)</option>
                        ))}
                    </select>
                    <div className="space-y-1 mt-3 text-sm text-emerald-100/70">
                        <div className="flex justify-between">
                            <span>Puntos a usar:</span>
                            <span>{freeHours * 10}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Puntos restantes:</span>
                            <span>{pointsAvailable - (freeHours * 10)}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-emerald-500/20">
                        <span className="text-emerald-200 font-bold">Total a cobrar:</span>
                        <span className="text-xl font-bold text-white">$0.00 (GRATIS)</span>
                    </div>
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="bg-slate-900 p-4 border-t border-slate-700 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={handleStart}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
            >
                <Play className="w-4 h-4 fill-current" /> Iniciar Sesión
            </button>
        </div>
      </div>
    </div>
  );
};

export default StartSessionModal;