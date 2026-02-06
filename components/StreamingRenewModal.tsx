import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { StreamingAccount } from '../types';
import { X, Calendar, Clock, RefreshCw, Save } from 'lucide-react';

interface Props {
    account: StreamingAccount;
    onClose: () => void;
}

const StreamingRenewModal: React.FC<Props> = ({ account, onClose }) => {
    const { updateStreamingAccount } = useCyber();
    
    const [mode, setMode] = useState<'DURATION' | 'MANUAL'>('DURATION');
    const [durationMonths, setDurationMonths] = useState(1);
    const [manualDate, setManualDate] = useState(() => {
        // Default manual date: Current expiration + 1 month
        const d = new Date(account.expirationDate);
        // If expired, start from today
        if (d.getTime() < Date.now()) {
            const today = new Date();
            today.setMonth(today.getMonth() + 1);
            return today.toISOString().split('T')[0];
        }
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().split('T')[0];
    });

    const calculateNewExpiration = () => {
        if (mode === 'MANUAL') {
            if (!manualDate) return account.expirationDate;
            const parts = manualDate.split('-');
            const d = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
            d.setHours(23, 59, 59);
            return d.getTime();
        } else {
            // Determine base date: If expired, start from NOW. If active, extend from Expiration.
            const baseTime = account.expirationDate < Date.now() ? Date.now() : account.expirationDate;
            const d = new Date(baseTime);
            d.setMonth(d.getMonth() + durationMonths);
            return d.getTime();
        }
    };

    const handleRenew = () => {
        const newExpiration = calculateNewExpiration();
        
        // Calculate new duration days just for record keeping
        const diff = newExpiration - Date.now();
        const newDurationDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));

        updateStreamingAccount({
            ...account,
            expirationDate: newExpiration,
            durationDays: newDurationDays,
            status: 'ACTIVE'
        });
        onClose();
    };

    const newDateDisplay = new Date(calculateNewExpiration()).toLocaleDateString('es-ES', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-emerald-600 p-4 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" /> Renovar Cuenta
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="text-center mb-4">
                        <p className="text-slate-400 text-xs uppercase font-bold">Vencimiento Actual</p>
                        <p className="text-white font-mono text-lg">
                            {new Date(account.expirationDate).toLocaleDateString('es-ES')}
                        </p>
                    </div>

                    {/* Toggle */}
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                        <button 
                            onClick={() => setMode('DURATION')}
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
                                mode === 'DURATION' 
                                ? 'bg-emerald-600 text-white shadow' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Clock className="w-3 h-3" /> Sumar Tiempo
                        </button>
                        <button 
                            onClick={() => setMode('MANUAL')}
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
                                mode === 'MANUAL' 
                                ? 'bg-emerald-600 text-white shadow' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Calendar className="w-3 h-3" /> Fecha Manual
                        </button>
                    </div>

                    {mode === 'DURATION' ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Tiempo a extender</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3, 6, 12].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setDurationMonths(m)}
                                        className={`py-2 rounded-lg border text-sm font-bold transition-all ${
                                            durationMonths === m 
                                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' 
                                            : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                                        }`}
                                    >
                                        +{m} Mes{m > 1 ? 'es' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Nueva fecha de corte</label>
                            <input 
                                type="date"
                                value={manualDate}
                                onChange={(e) => setManualDate(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500"
                            />
                        </div>
                    )}

                    <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4 text-center">
                        <p className="text-xs text-emerald-200/70 mb-1">Nuevo Vencimiento:</p>
                        <p className="text-lg font-bold text-emerald-400 capitalize">
                            {newDateDisplay}
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-end gap-2">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleRenew} 
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                    >
                        <Save className="w-4 h-4" /> Confirmar Renovación
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StreamingRenewModal;