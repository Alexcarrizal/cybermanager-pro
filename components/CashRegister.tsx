import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { Sale, PaymentMethod, Expense } from '../types';
import { DollarSign, TrendingUp, Package, Calendar, Edit2, Trash2, X, Save, ArrowDownCircle, AlertTriangle, MinusCircle, Tag } from 'lucide-react';
import ExpenseModal from './ExpenseModal';

const EXPENSE_CATEGORIES = ['Servicios', 'Renta', 'Mantenimiento', 'Insumos', 'Mercancía', 'Sueldos', 'Otros'];

const CashRegister: React.FC = () => {
    const { sales, expenses, updateSale, deleteSale, updateExpense, deleteExpense } = useCyber();
    
    // Init with Local Date instead of UTC to avoid timezone mismatches
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [saleToDelete, setSaleToDelete] = useState<string | null>(null); 
    
    // Expense States
    const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

    // Calculate start/end of day using local time construction
    const [year, month, day] = selectedDate.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();

    const filteredSales = sales.filter(s => s.timestamp >= startOfDay && s.timestamp <= endOfDay);
    const filteredExpenses = expenses.filter(e => e.timestamp >= startOfDay && e.timestamp <= endOfDay);

    // Calculations
    const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
    
    // Cost of Goods Sold (COGS)
    const totalCost = filteredSales.reduce((acc, sale) => {
        return acc + sale.items.reduce((sAcc, item) => sAcc + ((item.costAtSale || 0) * item.quantity), 0);
    }, 0);

    const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = totalRevenue - totalCost - totalExpenses; // Adjusted Net Profit to include expenses
    
    // Formatting
    const formatCurrency = (val: number) => `$${val.toFixed(2)}`;
    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Sale Actions
    const confirmDeleteSale = () => {
        if (saleToDelete) {
            deleteSale(saleToDelete);
            setSaleToDelete(null);
        }
    };

    const handleUpdateSale = () => {
        if (editingSale) {
            updateSale(editingSale.id, { 
                total: editingSale.total, 
                paymentMethod: editingSale.paymentMethod 
            });
            setEditingSale(null);
        }
    };

    // Expense Actions
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
            {/* Header & Date Picker */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Caja y Movimientos</h2>
                    <p className="text-slate-400">Resumen financiero y gestión de transacciones.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowAddExpenseModal(true)}
                        className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-rose-900/20 transition-all mr-2"
                    >
                        <MinusCircle className="w-5 h-5" /> Nueva Salida
                    </button>
                    <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-lg border border-slate-700">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-white outline-none font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Ingresos */}
                <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-emerald-500 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-20 h-20 text-emerald-500" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Ingresos</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(totalRevenue)}</h3>
                </div>

                {/* Costo */}
                <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-amber-500 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Package className="w-20 h-20 text-amber-500" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Costo Mercancía</p>
                    <h3 className="text-2xl font-bold text-white mt-1">-{formatCurrency(totalCost)}</h3>
                </div>

                {/* Gastos */}
                <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-rose-500 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowDownCircle className="w-20 h-20 text-rose-500" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Gastos Operativos</p>
                    <h3 className="text-2xl font-bold text-white mt-1">-{formatCurrency(totalExpenses)}</h3>
                </div>

                {/* Ganancia Real */}
                <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-blue-500 shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-20 h-20 text-blue-500" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Ganancia Neta</p>
                    <h3 className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-white' : 'text-rose-300'}`}>{formatCurrency(netProfit)}</h3>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-700 bg-slate-800/50">
                    <h3 className="text-lg font-bold text-white">Detalle de Ventas</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Hora</th>
                                <th className="px-6 py-4">Descripción / Items</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Método</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No hay ventas registradas para este día.
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.sort((a,b) => b.timestamp - a.timestamp).map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-300 font-mono text-sm">
                                            {formatTime(sale.timestamp)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {sale.items.map((item, idx) => (
                                                    <span key={idx} className="text-sm text-white">
                                                        {item.quantity}x {item.productName} 
                                                    </span>
                                                ))}
                                            </div>
                                            {sale.customerId !== 'public' && (
                                                <span className="text-xs text-blue-400 mt-1 block">Cliente: {sale.customerId}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                sale.type === 'POS' ? 'bg-indigo-500/20 text-indigo-300' :
                                                sale.type === 'RENTAL' ? 'bg-purple-500/20 text-purple-300' :
                                                'bg-emerald-500/20 text-emerald-300'
                                            }`}>
                                                {sale.type === 'POS' ? 'Venta' : sale.type === 'RENTAL' ? 'Renta' : 'Manual'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-300">
                                            {sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'CARD' ? 'Tarjeta' : 'Transfer.'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-white">
                                            {formatCurrency(sale.total)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => setEditingSale(sale)}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setSaleToDelete(sale.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Expenses Table */}
             <div className="mt-8 bg-slate-800 rounded-xl border border-rose-900/30 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-rose-900/30 bg-rose-900/10 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-rose-200 flex items-center gap-2">
                        <ArrowDownCircle className="w-5 h-5" /> Salidas / Gastos del Día
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/30 text-rose-300/50 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Hora</th>
                                <th className="px-6 py-3">Categoría</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3 text-right">Monto</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No hay gastos registrados hoy.
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map(expense => (
                                    <tr key={expense.id} className="hover:bg-slate-700/30">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-sm w-32">{formatTime(expense.timestamp)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getCategoryColor(expense.category)}`}>
                                                {expense.category || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white">{expense.description}</td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-400">-{formatCurrency(expense.amount)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => setEditingExpense(expense)}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Editar Gasto"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setExpenseToDelete(expense.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors"
                                                    title="Eliminar Gasto"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sale Delete Modal */}
            {saleToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 text-rose-500 mb-4">
                            <div className="p-3 bg-rose-500/10 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">¿Eliminar Venta?</h3>
                        </div>
                        
                        <p className="text-slate-400 mb-6">
                            Esta acción eliminará el registro de venta y afectará los cálculos de ingresos del día. No se puede deshacer.
                        </p>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setSaleToDelete(null)}
                                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDeleteSale}
                                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-900/20"
                            >
                                <Trash2 className="w-4 h-4" /> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sale Edit Modal */}
            {editingSale && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Editar Venta</h3>
                            <button onClick={() => setEditingSale(null)} className="text-slate-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Total ($)</label>
                                <input 
                                    type="number" 
                                    value={editingSale.total}
                                    onChange={(e) => setEditingSale({ ...editingSale, total: Number(e.target.value) })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Método de Pago</label>
                                <select 
                                    value={editingSale.paymentMethod}
                                    onChange={(e) => setEditingSale({ ...editingSale, paymentMethod: e.target.value as PaymentMethod })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                >
                                    <option value="CASH">Efectivo</option>
                                    <option value="CARD">Tarjeta</option>
                                    <option value="TRANSFER">Transferencia</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button 
                                onClick={() => setEditingSale(null)}
                                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleUpdateSale}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expense Delete Modal */}
            {expenseToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
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
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Editar Gasto</h3>
                            <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Categoría</label>
                                <select 
                                    value={editingExpense.category || 'Otros'}
                                    onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                >
                                    {EXPENSE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
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

export default CashRegister;