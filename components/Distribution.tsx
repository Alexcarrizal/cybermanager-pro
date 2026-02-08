import React, { useState, useEffect } from 'react';
import { useCyber } from '../context/CyberContext';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Settings, Save, X, Edit3, PieChart, Info, Wallet, ArrowDownCircle, Edit2, Trash2, AlertTriangle, Plus, Eye, EyeOff } from 'lucide-react';
import { DistributionRule, Expense } from '../types';
import ExpenseModal from './ExpenseModal';

const Distribution: React.FC = () => {
  const { sales, expenses, businessSettings, updateBusinessSettings, deleteExpense, updateExpense } = useCyber();
  
  // Date Selection: Default to current date for Weekly calculation
  const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
  });
  
  // Settings Mode
  const [isEditing, setIsEditing] = useState(false);
  const [tempRules, setTempRules] = useState<DistributionRule[]>([]);
  
  // Privacy State
  const [showPrivacy, setShowPrivacy] = useState(true);
  
  // Detail Modal State
  const [selectedRule, setSelectedRule] = useState<DistributionRule | null>(null);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  
  // Create Expense Modal State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Expense Edit/Delete States
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Init local rules from context when not editing
  useEffect(() => {
      if (!isEditing && businessSettings.distributionRules) {
          setTempRules(JSON.parse(JSON.stringify(businessSettings.distributionRules)));
      }
  }, [businessSettings, isEditing]);

  // --- Calculations (WEEKLY: Saturday to Friday) ---
  
  const [year, month, day] = selectedDate.split('-').map(Number);
  const currentDate = new Date(year, month - 1, day);
  
  const dayOfWeek = currentDate.getDay(); // 0 (Sun) - 6 (Sat)
  // Calculate days since last Saturday
  // Sat (6) -> 0 days back
  // Sun (0) -> 1 day back ... Fri (5) -> 6 days back
  const daysSinceSaturday = (dayOfWeek + 1) % 7;
  
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - daysSinceSaturday);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startTs = startOfWeek.getTime();
  const endTs = endOfWeek.getTime();

  const filteredSales = sales.filter(s => Number(s.timestamp) >= startTs && Number(s.timestamp) <= endTs);
  const filteredExpenses = expenses.filter(e => Number(e.timestamp) >= startTs && Number(e.timestamp) <= endTs);

  // 1. Total Revenue
  const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);

  // 2. Total Costs (COGS)
  const totalCOGS = filteredSales.reduce((acc, sale) => {
      return acc + sale.items.reduce((sAcc, item) => sAcc + ((item.costAtSale || 0) * item.quantity), 0);
  }, 0);

  // 3. Total Expenses
  const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  // 4. NET REAL PROFIT
  const netRealProfit = totalRevenue - totalCOGS - totalExpenses;

  // 5. Distribution Logic
  const activeRules = isEditing ? tempRules : (businessSettings.distributionRules || []);
  
  // Helper to get distributed amount
  const getDistributedAmount = (percentage: number) => {
      if (netRealProfit <= 0) return 0;
      return netRealProfit * (percentage / 100);
  };

  // Helper for masking
  const formatCurrency = (val: number) => {
      return showPrivacy ? `$${val.toFixed(2)}` : '••••••';
  };

  // --- Handlers ---

  const handleSaveSettings = () => {
      // Validate percentages sum to 100
      const totalPercent = tempRules.reduce((acc, r) => acc + r.percentage, 0);
      if (totalPercent !== 100) {
          alert(`Los porcentajes deben sumar 100%. Suma actual: ${totalPercent}%`);
          return;
      }

      updateBusinessSettings({
          ...businessSettings,
          distributionRules: tempRules
      });
      setIsEditing(false);
  };

  const handleRuleChange = (id: string, field: keyof DistributionRule, value: string | number) => {
      setTempRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddRule = () => {
      setTempRules(prev => [...prev, {
          id: Date.now().toString(),
          name: 'Nuevo Fondo',
          percentage: 0,
          color: 'text-slate-400'
      }]);
  };

  const handleDeleteRule = (id: string) => {
      setTempRules(prev => prev.filter(r => r.id !== id));
  };

  const confirmDeleteExpense = () => {
    if (expenseToDelete) {
        deleteExpense(expenseToDelete);
        setExpenseToDelete(null);
    }
  };

  const handleUpdateExpense = () => {
    if (editingExpense) {
        updateExpense(editingExpense.id, {
            description: editingExpense.description,
            amount: editingExpense.amount,
            category: editingExpense.category
        });
        setEditingExpense(null);
    }
  };

  const getCategoryColor = (cat?: string) => {
    switch(cat) {
        case 'Servicios': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'Renta': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case 'Mercancía': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case 'Sueldos': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        default: return 'bg-slate-700 text-slate-400 border-slate-600';
    }
};

  return (
    <div className="p-8 h-full overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <PieChart className="w-8 h-8 text-blue-500" />
                Distribución de Ganancias
            </h2>
            <p className="text-slate-400">Análisis y reparto de utilidades netas por semana.</p>
          </div>
          
          <div className="flex gap-4 items-center">
              
              {/* Privacy Toggle */}
              <button 
                onClick={() => setShowPrivacy(!showPrivacy)}
                className="p-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                title={showPrivacy ? "Ocultar Cantidades" : "Mostrar Cantidades"}
              >
                  {showPrivacy ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
                  <Calendar className="w-5 h-5 text-slate-400 ml-2" />
                  <div className="text-sm text-slate-300 mr-2 text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Semana (Sáb - Vie)</span>
                      {startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} al {endOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </div>
                  <input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-slate-900 text-white border border-slate-600 rounded px-2 py-1 text-sm outline-none cursor-pointer"
                  />
              </div>
              
              {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 font-bold ring-1 ring-blue-400/50"
                    title="Editar Reglas de Distribución"
                  >
                      <Settings className="w-5 h-5" />
                      <span>Configurar Reparto</span>
                  </button>
              ) : (
                  <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                        title="Cancelar Edición"
                      >
                          <X className="w-5 h-5" /> Cancelar
                      </button>
                      <button 
                        onClick={handleSaveSettings}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-900/20 transition-colors font-bold flex items-center gap-2"
                        title="Guardar Cambios"
                      >
                          <Save className="w-5 h-5" /> Guardar
                      </button>
                  </div>
              )}
          </div>
      </div>

      {/* Editing Mode Warning/Inputs */}
      {isEditing && (
          <div className="bg-slate-800 border border-blue-500/50 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                      <Edit3 className="w-5 h-5" /> Editor de Apartados
                  </h3>
                  <button 
                    onClick={handleAddRule}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md"
                  >
                      <Plus className="w-4 h-4" /> Agregar Nuevo Apartado
                  </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {tempRules.map(rule => (
                      <div key={rule.id} className="bg-slate-900 p-5 rounded-xl border border-slate-700 relative group shadow-lg">
                          <button 
                            onClick={() => handleDeleteRule(rule.id)}
                            className="absolute -top-3 -right-3 bg-rose-600 text-white p-2 rounded-full shadow-md hover:bg-rose-500 transition-all z-10"
                            title="Eliminar este apartado"
                          >
                              <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="space-y-3">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                                  <input 
                                      type="text" 
                                      value={rule.name}
                                      onChange={(e) => handleRuleChange(rule.id, 'name', e.target.value)}
                                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none font-medium"
                                      placeholder="Ej. Ahorro"
                                  />
                              </div>
                              
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Porcentaje</label>
                                  <div className="relative">
                                      <input 
                                          type="number" 
                                          value={rule.percentage}
                                          onChange={(e) => handleRuleChange(rule.id, 'percentage', Number(e.target.value))}
                                          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white font-bold focus:border-blue-500 outline-none pr-8"
                                      />
                                      <span className="absolute right-3 top-2.5 text-slate-500 font-bold">%</span>
                                  </div>
                              </div>
                              
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color Etiqueta</label>
                                  <select 
                                    value={rule.color}
                                    onChange={(e) => handleRuleChange(rule.id, 'color', e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none cursor-pointer"
                                  >
                                     <option value="text-blue-500">Azul</option>
                                     <option value="text-emerald-500">Verde</option>
                                     <option value="text-purple-500">Morado</option>
                                     <option value="text-orange-500">Naranja</option>
                                     <option value="text-rose-500">Rosa</option>
                                     <option value="text-cyan-500">Cian</option>
                                     <option value="text-amber-500">Amarillo</option>
                                     <option value="text-slate-400">Gris</option>
                                  </select>
                              </div>
                          </div>
                      </div>
                  ))}
                  
                  {/* Empty state helper if no rules */}
                  {tempRules.length === 0 && (
                      <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
                          No hay apartados configurados. Agrega uno nuevo.
                      </div>
                  )}
              </div>
              
              <div className="mt-6 flex justify-end items-center gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                  <span className="text-sm text-slate-400">La suma debe ser exactamente 100%</span>
                  <div className={`text-xl font-bold px-4 py-2 rounded-lg ${tempRules.reduce((a,b)=>a+b.percentage,0) === 100 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-rose-500/20 text-rose-400 border border-rose-500/50'}`}>
                      Total: {tempRules.reduce((a,b)=>a+b.percentage,0)}%
                  </div>
              </div>
          </div>
      )}

      {/* Main Stats Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Revenue */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-xs uppercase font-bold">Ingresos Totales</p>
              <h4 className="text-xl font-bold text-white mt-1">{formatCurrency(totalRevenue)}</h4>
              <div className="flex items-center gap-1 text-emerald-400 text-xs mt-2">
                  <TrendingUp className="w-3 h-3" /> Ventas Semana
              </div>
          </div>

          {/* COGS */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-xs uppercase font-bold">Costo Mercancía</p>
              <h4 className="text-xl font-bold text-white mt-1">
                  {showPrivacy ? `-$${totalCOGS.toFixed(2)}` : '••••••'}
              </h4>
              <div className="flex items-center gap-1 text-amber-400 text-xs mt-2">
                  <TrendingDown className="w-3 h-3" /> Costos Directos
              </div>
          </div>

          {/* Expenses */}
          <div 
            onClick={() => setShowExpensesModal(true)}
            className="bg-slate-800 p-4 rounded-xl border border-slate-700 cursor-pointer hover:border-rose-500/50 transition-all hover:bg-slate-700/30 group"
          >
              <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-xs uppercase font-bold">Gastos Operativos</p>
                    <h4 className="text-xl font-bold text-white mt-1">
                        {showPrivacy ? `-$${totalExpenses.toFixed(2)}` : '••••••'}
                    </h4>
                </div>
                <ArrowDownCircle className="w-5 h-5 text-slate-600 group-hover:text-rose-500 transition-colors" />
              </div>
              <div className="flex items-center gap-1 text-rose-400 text-xs mt-2">
                  <TrendingDown className="w-3 h-3" /> Luz, Renta, etc.
              </div>
          </div>

          {/* Net Profit - Highlighted */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-1 rounded-xl shadow-lg shadow-blue-900/40">
              <div className="bg-slate-900/50 backdrop-blur-sm h-full w-full rounded-lg p-4 flex flex-col justify-center">
                  <p className="text-blue-200 text-xs uppercase font-bold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Ganancia Real Neta
                  </p>
                  <h4 className={`text-2xl font-bold mt-1 ${netRealProfit >= 0 ? 'text-white' : 'text-rose-300'}`}>
                      {formatCurrency(netRealProfit)}
                  </h4>
                  <p className="text-xs text-blue-200/70 mt-1">Disponible para distribuir</p>
              </div>
          </div>
      </div>

      {/* Distribution Modules */}
      <h3 className="text-xl font-bold text-white mb-6 pl-2 border-l-4 border-emerald-500">
          Reparto de Utilidades
      </h3>

      {netRealProfit > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {activeRules.map((rule) => {
                  const amount = getDistributedAmount(rule.percentage);
                  return (
                    <div 
                        key={rule.id} 
                        onClick={() => setSelectedRule(rule)}
                        className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${rule.color.replace('text-', 'bg-')}`}></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="text-lg font-bold text-white group-hover:text-blue-200 transition-colors flex items-center gap-2">
                                    <Wallet className="w-5 h-5" />
                                    {rule.name}
                                </h4>
                                <span className={`text-sm font-bold px-2 py-1 rounded bg-slate-900 ${rule.color}`}>
                                    {rule.percentage}%
                                </span>
                            </div>
                            
                            <div className="flex items-baseline gap-1">
                                <span className={`text-4xl font-bold ${rule.color}`}>
                                    {formatCurrency(amount)}
                                </span>
                            </div>
                            
                            <div className="w-full bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
                                <div 
                                    className={`h-full ${rule.color.replace('text-', 'bg-')}`} 
                                    style={{ width: '100%' }} // Just visual bar
                                ></div>
                            </div>

                            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Info className="w-3 h-3" /> Clic para más detalles
                            </p>
                        </div>
                    </div>
                  );
              })}
          </div>
      ) : (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-10 text-center">
              <p className="text-slate-400 text-lg">
                  No hay ganancias netas suficientes en este periodo para realizar la distribución.
              </p>
              {netRealProfit < 0 && (
                  <p className="text-rose-400 mt-2 font-bold">
                      El negocio presenta pérdidas de {showPrivacy ? `$${Math.abs(netRealProfit).toFixed(2)}` : '••••••'}
                  </p>
              )}
          </div>
      )}

      {/* Distribution Detail Modal */}
      {selectedRule && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className={`h-2 w-full ${selectedRule.color.replace('text-', 'bg-')}`}></div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-slate-700 ${selectedRule.color}`}>
                                <Wallet className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">{selectedRule.name}</h3>
                        </div>
                        <button onClick={() => setSelectedRule(null)} className="text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="bg-slate-900/50 rounded-xl p-6 text-center border border-slate-700 mb-6">
                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Monto Disponible</p>
                        <p className={`text-4xl font-bold ${selectedRule.color}`}>
                            {formatCurrency(getDistributedAmount(selectedRule.percentage))}
                        </p>
                    </div>

                    <div className="space-y-3 text-sm text-slate-300">
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span>Periodo:</span>
                            <span className="text-white font-medium">Semana del {startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span>Ganancia Neta Total:</span>
                            <span className="text-white font-medium">{formatCurrency(netRealProfit)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                            <span>Porcentaje Asignado:</span>
                            <span className="text-white font-medium">{selectedRule.percentage}%</span>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-blue-300 leading-relaxed text-center">
                            Este fondo representa el <strong>{selectedRule.percentage}%</strong> de las utilidades reales de la semana. Asegúrate de apartar este dinero físicamente o transferirlo a la cuenta correspondiente.
                        </p>
                    </div>
                    
                    <div className="mt-6">
                         <button 
                            onClick={() => setSelectedRule(null)}
                            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
                         >
                            Cerrar
                         </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Expenses Detail Modal */}
      {showExpensesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-rose-500" />
                        Detalle de Gastos
                    </h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowAddExpenseModal(true)}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 shadow-lg shadow-rose-900/20"
                        >
                            <Plus className="w-4 h-4" /> Registrar Gasto
                        </button>
                        <button onClick={() => setShowExpensesModal(false)} className="text-slate-400 hover:text-white ml-2">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {filteredExpenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                            <p>No hay gastos registrados en esta semana.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-400 mb-2 font-medium">Periodo: {startOfWeek.toLocaleDateString('es-ES')} - {endOfWeek.toLocaleDateString('es-ES')}</p>
                            {filteredExpenses.map(expense => (
                                <div key={expense.id} className="flex justify-between items-center p-4 bg-slate-700/30 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                             <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getCategoryColor(expense.category)}`}>
                                                {expense.category || 'Otros'}
                                            </span>
                                        </div>
                                        <p className="text-white font-medium">{expense.description}</p>
                                        <p className="text-xs text-slate-500 capitalize">{new Date(expense.timestamp).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-rose-400 font-bold text-lg">
                                            {showPrivacy ? `-$${expense.amount.toFixed(2)}` : '••••••'}
                                        </span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setEditingExpense(expense); }}
                                                className="p-2 text-slate-500 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setExpenseToDelete(expense.id); }}
                                                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Total Gastos</span>
                    <span className="text-2xl font-bold text-rose-500">
                        {showPrivacy ? `-$${totalExpenses.toFixed(2)}` : '••••••'}
                    </span>
                </div>
            </div>
        </div>
      )}

      {/* Expense Delete Confirmation */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 text-rose-500 mb-4">
                    <div className="p-3 bg-rose-500/10 rounded-full">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">¿Eliminar Gasto?</h3>
                </div>
                
                <p className="text-slate-400 mb-6">
                    Esta acción eliminará el registro de gasto permanentemente.
                </p>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setExpenseToDelete(null)}
                        className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmDeleteExpense}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-900/20"
                    >
                        <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Expense Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Editar Gasto</h3>
                    <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Descripción</label>
                        <input 
                            type="text" 
                            value={editingExpense.description}
                            onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Monto ($)</label>
                        <input 
                            type="number" 
                            value={editingExpense.amount}
                            onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button 
                        onClick={() => setEditingExpense(null)}
                        className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleUpdateExpense}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Guardar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && <ExpenseModal onClose={() => setShowAddExpenseModal(false)} />}
    </div>
  );
};

export default Distribution;