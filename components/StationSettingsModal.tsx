import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { Station, DeviceType, StationStatus } from '../types';
import { X, Trash2, Save, AlertTriangle, Receipt } from 'lucide-react';

interface Props {
  station: Station;
  onClose: () => void;
}

const StationSettingsModal: React.FC<Props> = ({ station, onClose }) => {
  const { updateStation, deleteStation, tariffs } = useCyber();
  const [name, setName] = useState(station.name);
  const [type, setType] = useState(station.type);
  const [tariffId, setTariffId] = useState(station.tariffId || '');
  const [showConfirm, setShowConfirm] = useState(false);

  // Combined Handler for Type/Tariff Selection
  const handleTypeSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      const tariff = tariffs.find(t => t.id === val);
      
      if (tariff) {
          setTariffId(tariff.id);
          setType(tariff.deviceType);
      } else {
          // Fallback for Generic Types
          setTariffId('');
          setType(val as DeviceType);
      }
  };

  const handleSave = () => {
    updateStation({
      ...station,
      name,
      type,
      tariffId: tariffId || undefined
    });
    onClose();
  };

  const handleDelete = () => {
    if (station.status === StationStatus.OCCUPIED) {
      alert("No puedes eliminar una estación que está en uso.");
      return;
    }
    deleteStation(station.id);
  };

  // Determine current value for the unified select
  // If tariffId exists and is valid, use it. Otherwise use the raw type.
  const currentSelectValue = (tariffId && tariffs.some(t => t.id === tariffId)) ? tariffId : type;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Configurar Equipo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Nombre del Equipo</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej. PC Gamer 01"
            />
          </div>

          {/* Unified Type / Tariff Selection */}
          <div>
             <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Tipo de Equipo / Tarifa
             </label>
             <select 
                value={currentSelectValue}
                onChange={handleTypeSelection}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
             >
                <optgroup label="Tarifas Guardadas">
                    {tariffs.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.deviceType})</option>
                    ))}
                </optgroup>
                <optgroup label="Tipos Genéricos (Sin Tarifa)">
                    {Object.values(DeviceType).map(dt => (
                        <option key={dt} value={dt}>{dt}</option>
                    ))}
                </optgroup>
             </select>
             <p className="text-xs text-slate-500 mt-2">
                Selecciona una tarifa guardada para aplicar sus precios automáticamente.
             </p>
          </div>

          {/* Delete Section with Inline Confirmation */}
          <div className="pt-4 border-t border-slate-700">
             {!showConfirm ? (
                <button 
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="w-full py-3 bg-rose-900/20 hover:bg-rose-900/40 text-rose-500 border border-rose-900/50 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                >
                    <Trash2 className="w-5 h-5" /> Eliminar Equipo Permanentemente
                </button>
             ) : (
                <div className="bg-rose-950/30 border border-rose-500/30 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-rose-400 mb-2 font-bold">
                        <AlertTriangle className="w-5 h-5" />
                        ¿Estás seguro?
                    </div>
                    <p className="text-sm text-slate-300 mb-4">
                        Se eliminará <strong>{station.name}</strong> y no podrás deshacer esta acción.
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-rose-900/20 transition-colors"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
             )}
             
             {!showConfirm && (
                <p className="text-xs text-rose-400/60 text-center mt-2">
                 * Solo se puede eliminar si no está en uso
                </p>
             )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-900/50 border-t border-slate-700 flex gap-3 sticky bottom-0">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Guardar Cambios
          </button>
        </div>

      </div>
    </div>
  );
};

export default StationSettingsModal;