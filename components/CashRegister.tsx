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
  const [source, setSource] = useState<'CASH_REGISTER' | 'PROFIT'>('CASH_REGISTER');

  const handleRegister = () => {
    if (!amount || Number(amount) <= 0 || !description) return;

    addExpense({
      description,
      amount: Number(amount),
      category,
      source
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
          
          {/* Source Selection (Nuevo) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Wallet className="w-4 h-4" /> Origen de los Fondos
            </label>
            <div className="grid grid-cols-2 gap-3">
               <button
                  onClick={() => setSource('CASH_REGISTER')}
                  className={`p-3 rounded-lg border text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                      source === 'CASH_REGISTER'
                      ? 'bg-rose-50 border-rose-500 text-rose-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-rose-300'
                  }`}
               >
                  <span>Caja del Día</span>
                  <span className="text-[10px] opacity-75 font-normal">Afecta el corte</span>
               </button>
               <button
                  onClick={() => setSource('PROFIT')}
                  className={`p-3 rounded-lg border text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                      source === 'PROFIT'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                  }`}
               >
                  <span>Fondo / Ganancias</span>
                  <span className="text-[10px] opacity-75 font-normal">Solo afecta utilidad</span>
               </button>
            </div>
          </div>

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
                            ? 'bg-gray-800 text-white border-gray-800' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
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