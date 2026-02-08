import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { X, ArrowDownCircle, Plus, Tag, Wallet } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const EXPENSE_CATEGORIES = ['Servicios', 'Renta', 'Mantenimiento', 'Insumos', 'Mercancía', 'Sueldos', 'Otros'];

const ExpenseModal: React.FC<Props> = ({ onClose }) => {
  const { addExpense } = useCyber();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Otros');
  const [affectsCash, setAffectsCash] = useState(false); // Default to FALSE per request

  const handleRegister = () => {
    if (!amount || Number(amount) <= 0 || !description) return;

    addExpense({
      description,
      amount: Number(amount),
      category,
      affectsCashBox: affectsCash
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header - Red */}
        <div className="bg-rose-600 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="bg-white/20 p-1 rounded-full"><ArrowDownCircle className="w-5 h-5" /></div>
            Nueva Salida
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Tag className="w-4 h-4" /> Categoría
            </label>
            <div className="flex flex-wrap gap-2">
                {EXPENSE_CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            category === cat 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
          </div>

          {/* Description Input */}
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
             <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl py-3 px-4 text-gray-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all placeholder:text-gray-400"
                placeholder="Ej: Compra de papelería, pago de luz..."
                autoFocus
             />
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
                  className="w-full bg-white border border-gray-300 rounded-xl py-3 pl-8 pr-4 text-gray-900 text-xl font-bold outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all placeholder:text-gray-300"
                  placeholder="0.00"
                />
             </div>
          </div>

          {/* Affect Cash Toggle */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="flex items-center justify-between cursor-pointer gap-4">
                  <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${affectsCash ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                          <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                          <span className="block text-sm font-bold text-slate-700">Retirar dinero de Caja</span>
                          <span className="block text-xs text-slate-500">
                              {affectsCash 
                                ? 'El dinero se descontará del efectivo actual.' 
                                : 'Solo se registra como gasto (no afecta caja).'}
                          </span>
                      </div>
                  </div>
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${affectsCash ? 'bg-rose-500' : 'bg-slate-300'}`}>
                      <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={affectsCash}
                          onChange={(e) => setAffectsCash(e.target.checked)}
                      />
                      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${affectsCash ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
              </label>
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
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" /> Registrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExpenseModal;