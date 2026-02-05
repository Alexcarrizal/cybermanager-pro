import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { X, Plus, Monitor, Wrench, Smartphone } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const EntryModal: React.FC<Props> = ({ onClose }) => {
  const { recordSale } = useCyber();
  const [category, setCategory] = useState<'CIBER' | 'SERVICIOS' | 'RECARGAS'>('CIBER');
  const [amount, setAmount] = useState('');

  const handleRegister = () => {
    if (!amount || Number(amount) <= 0) return;

    let description = '';
    switch (category) {
        case 'CIBER': description = 'Entrada Manual: Ciber'; break;
        case 'SERVICIOS': description = 'Entrada Manual: Servicios'; break;
        case 'RECARGAS': description = 'Entrada Manual: Recargas Electrónicas'; break;
    }

    recordSale(
      [{
        productId: 'MANUAL_ENTRY',
        productName: description,
        quantity: 1,
        priceAtSale: Number(amount)
      }],
      'MANUAL_ENTRY',
      'CASH',
      'public'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header - Green */}
        <div className="bg-emerald-600 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="bg-white/20 p-1 rounded-full"><Plus className="w-5 h-5" /></div>
            Nueva Entrada
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Category Selection */}
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-3">Categoría</label>
             <div className="grid grid-cols-3 gap-3">
               <button 
                  onClick={() => setCategory('CIBER')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    category === 'CIBER' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-gray-200 text-gray-400 hover:border-emerald-200'
                  }`}
               >
                  <Monitor className="w-6 h-6" />
                  <span className="font-bold text-sm">Ciber</span>
               </button>

               <button 
                  onClick={() => setCategory('SERVICIOS')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    category === 'SERVICIOS' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-gray-200 text-gray-400 hover:border-emerald-200'
                  }`}
               >
                  <Wrench className="w-6 h-6" />
                  <span className="font-bold text-sm">Servicios</span>
               </button>

               <button 
                  onClick={() => setCategory('RECARGAS')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    category === 'RECARGAS' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-gray-200 text-gray-400 hover:border-emerald-200'
                  }`}
               >
                  <Smartphone className="w-6 h-6" />
                  <span className="font-bold text-sm leading-tight text-center">Recargas</span>
               </button>
             </div>
          </div>

          {/* Amount Input */}
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Monto *</label>
             <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 font-bold">$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl py-3 pl-8 pr-4 text-gray-900 text-xl font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all placeholder:text-gray-300"
                  placeholder="0.00"
                  autoFocus
                />
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleRegister}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" /> Registrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default EntryModal;