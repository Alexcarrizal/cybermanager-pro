import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { Sale, Expense, CashCut } from '../types';
import { DollarSign, TrendingUp, Package, Calendar, Edit2, Trash2, X, Save, ArrowDownCircle, AlertTriangle, MinusCircle, Tag, Lock, Unlock, History, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import ExpenseModal from './ExpenseModal';

const EXPENSE_CATEGORIES = ['Servicios', 'Renta', 'Mantenimiento', 'Insumos', 'Mercancía', 'Sueldos', 'Otros'];

const CashRegister: React.FC = () => {
    const { 
        sales, expenses, updateSale, deleteSale, updateExpense, deleteExpense,
        activeCashCut, openRegister, closeRegister, updateCashCut, cashCuts
    } = useCyber();
    
    // View State
    const [view, setView] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

    // UI States for Open/Close
    const [openAmount, setOpenAmount] = useState('');
    const [closeAmount, setCloseAmount] = useState('');
    const [closeNotes, setCloseNotes] = useState('');
    const [showCloseModal, setShowCloseModal] = useState(false);

    // Sales/Expense Edit States
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [saleToDelete, setSaleToDelete] = useState<string | null>(null); 
    const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

    // --- Calculations for ACTIVE SESSION ---
    const startTs = activeCashCut ? activeCashCut.startTime : Date.now();
    const endTs = Date.now(); // Live

    const filteredSales = activeCashCut 
        ? sales.filter(s => s.timestamp >= startTs && s.timestamp <= endTs)
        : [];
    
    // Filter Expenses: Timeframe + affectsCashBox flag
    // Legacy expenses (undefined) default to true (affect cash box)
    const filteredExpenses = activeCashCut 
        ? expenses.filter(e => 
            e.timestamp >= startTs && 
            e.timestamp <= endTs && 
            e.affectsCashBox !== false // Only show if it affects cash
          )
        : [];

    const totalRevenue = filteredSales.reduce((acc, sale) => acc + Number(sale.total), 0);
    const totalCOGS = filteredSales.reduce((acc, sale) => acc + sale.items.reduce((sAcc, item) => sAcc + ((item.costAtSale || 0) * item.quantity), 0), 0);
    const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
    const netProfit = totalRevenue - totalCOGS - totalExpenses;

    const cashSales = filteredSales.filter(s => s.paymentMethod === 'CASH').reduce((a,b) => a + Number(b.total), 0);
    const cardSales = filteredSales.filter(s => s.paymentMethod === 'CARD' || s.paymentMethod === 'CLIP').reduce((a,b) => a + Number(b.total), 0);
    
    const initialCash = activeCashCut ? Number(activeCashCut.initialCash) : 0;
    const expectedCashInDrawer = initialCash + cashSales - totalExpenses;

    // --- Orphaned Sales Detection (Sales made today BUT before the current cut started) ---
    // Only check if we have an active cut
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    
    const orphanedSales = (activeCashCut) 
        ? sales.filter(s => s.timestamp >= startOfDay.getTime() && s.timestamp < activeCashCut.startTime)
        : [];
    
    const orphanedAmount = orphanedSales.reduce((acc, s) => acc + s.total, 0);

    // Formatting
    const formatCurrency = (val: number) => `$${val.toFixed(2)}`;
    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (ts: number) => new Date(ts).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // --- Actions ---
    const handleOpenRegister = () => {
        if (!openAmount || Number(openAmount) < 0) return alert("Ingrese un monto inicial válido.");
        openRegister(Number(openAmount));
        setOpenAmount('');
    };

    const handleCloseRegister = () => {
        if (!closeAmount) return alert("Ingrese el efectivo contado.");
        closeRegister(Number(closeAmount), closeNotes);
        setShowCloseModal(false);
        setCloseAmount('');
        setCloseNotes('');
    };

    const handleIncludeOrphans = () => {
        if (!activeCashCut || orphanedSales.length === 0) return;
        // Find earliest timestamp
        const earliest = Math.min(...orphanedSales.map(s => s.timestamp));
        // Update cut start time
        updateCashCut({
            ...activeCashCut,
            startTime: earliest
        });
    };

    // Sub-actions
    const confirmDeleteSale = () => {
        if (saleToDelete) { deleteSale(saleToDelete); setSaleToDelete(null); }
    };
    const handleUpdateSale = () => {
        if (editingSale) { updateSale(editingSale.id, { total: editingSale.total, paymentMethod: editingSale.paymentMethod }); setEditingSale(null); }
    };
    const confirmDeleteExpense = () => {
        if (expenseToDelete) { deleteExpense(expenseToDelete); setExpenseToDelete(null); }
    };
    const handleUpdateExpense = () => {
        if (editingExpense) {
            updateExpense(editingExpense.id, { description: editingExpense.description, amount: editingExpense.amount, category: editingExpense.category });
            setEditingExpense(null);
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            {/* Header Tabs */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Control de Caja</h2>
                    <p className="text-slate-400">Gestiona aperturas, cierres y movimientos del día.</p>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button 
                        onClick={() => setView('ACTIVE')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${view === 'ACTIVE' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Unlock className="w-4 h-4" /> Caja Actual
                    </button>
                    <button 
                        onClick={() => setView('HISTORY')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${view === 'HISTORY' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <History className="w-4 h-4" /> Historial Cortes
                    </button>
                </div>
            </div>

            {view === 'ACTIVE' && (
                <>
                    {!activeCashCut ? (
                        /* CLOSED STATE - OPEN REGISTER */
                        <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in zoom-in duration-300">
                            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full text-center">
                                <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Lock className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Caja Cerrada</h3>
                                <p className="text-slate-400 mb-6">Ingresa el fondo inicial para comenzar las operaciones del día.</p>
                                
                                <form onSubmit={(e) => { e.preventDefault(); handleOpenRegister(); }}>
                                    <div className="mb-6 text-left">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Monto Inicial (Fondo)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3 text-slate-500 font-bold">$</span>
                                            <input 
                                                type="number" 
                                                value={openAmount}
                                                onChange={(e) => setOpenAmount(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 pl-8 pr-4 text-white text-lg font-bold outline-none focus:border-emerald-500 transition-colors"
                                                placeholder="0.00"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Unlock className="w-5 h-5" /> Abrir Caja
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        /* OPEN STATE - DASHBOARD */
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Orphaned Sales Warning */}
                            {orphanedSales.length > 0 && (
                                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-6 h-6 text-amber-500" />
                                        <div>
                                            <p className="text-amber-200 font-bold">Ventas previas detectadas hoy</p>
                                            <p className="text-amber-200/70 text-sm">
                                                Hay {orphanedSales.length} ventas ({formatCurrency(orphanedAmount)}) registradas hoy antes de la apertura de caja.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleIncludeOrphans}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-lg shadow-lg"
                                    >
                                        Incluir en este Corte
                                    </button>
                                </div>
                            )}

                            {/* Action Bar */}
                            <div className="flex justify-between items-center mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> CAJA ABIERTA
                                    </div>
                                    <span className="text-slate-400 text-sm">
                                        Inició: <span className="text-white font-mono">{new Date(activeCashCut.startTime).toLocaleTimeString()}</span>
                                    </span>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowAddExpenseModal(true)}
                                        className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
                                    >
                                        <MinusCircle className="w-4 h-4" /> Registrar Gasto
                                    </button>
                                    <button 
                                        onClick={() => setShowCloseModal(true)}
                                        className="bg-slate-100 hover:bg-white text-slate-900 px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"
                                    >
                                        <Lock className="w-4 h-4" /> Cerrar Caja
                                    </button>
                                </div>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                {/* Cash in Drawer (Calculated) */}
                                <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-emerald-500 shadow-xl relative overflow-hidden">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Efectivo Esperado</p>
                                    <h3 className="text-3xl font-bold text-white mt-1">{formatCurrency(expectedCashInDrawer)}</h3>
                                    <p className="text-[10px] text-emerald-400/80 mt-1">Fondo Inicial: {formatCurrency(initialCash)}</p>
                                </div>

                                {/* Total Sales */}
                                <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-blue-500 shadow-xl">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Ventas Totales</p>
                                    <h3 className="text-3xl font-bold text-white mt-1">{formatCurrency(totalRevenue)}</h3>
                                    <div className="flex gap-2 mt-2 text-[10px] text-slate-400">
                                        <span className="bg-slate-700 px-1 rounded">Efe: {formatCurrency(cashSales)}</span>
                                        <span className="bg-slate-700 px-1 rounded">Dig: {formatCurrency(cardSales)}</span>
                                    </div>
                                </div>

                                {/* Expenses */}
                                <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-rose-500 shadow-xl">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Salidas (Efectivo)</p>
                                    <h3 className="text-3xl font-bold text-white mt-1">-{formatCurrency(totalExpenses)}</h3>
                                    <p className="text-[10px] text-rose-400/80 mt-1">Retiros de caja</p>
                                </div>

                                {/* Net Profit */}
                                <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-purple-500 shadow-xl">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Ganancia Neta (Est.)</p>
                                    <h3 className="text-3xl font-bold text-white mt-1">{formatCurrency(netProfit)}</h3>
                                    <p className="text-[10px] text-purple-400/80 mt-1">Ventas - Costos - Gastos (Caja)</p>
                                </div>
                            </div>

                            {/* Tables Container */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Sales Table */}
                                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl flex flex-col h-[500px]">
                                    <div className="p-4 bg-slate-900/50 border-b border-slate-700">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Movimientos de Entrada</h3>
                                    </div>
                                    <div className="overflow-y-auto flex-1">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-800 text-xs text-slate-500 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2">Hora</th>
                                                    <th className="px-4 py-2">Desc.</th>
                                                    <th className="px-4 py-2 text-right">Monto</th>
                                                    <th className="px-4 py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700/50">
                                                {filteredSales.map(sale => (
                                                    <tr key={sale.id} className="hover:bg-slate-700/20 text-sm">
                                                        <td className="px-4 py-2 text-slate-400 font-mono">{formatTime(sale.timestamp)}</td>
                                                        <td className="px-4 py-2 text-white truncate max-w-[150px]">
                                                            {sale.items.length} items ({sale.type})
                                                        </td>
                                                        <td className="px-4 py-2 text-right text-emerald-400 font-bold">{formatCurrency(sale.total)}</td>
                                                        <td className="px-4 py-2 text-right">
                                                            <button onClick={() => setSaleToDelete(sale.id)} className="text-slate-500 hover:text-rose-500"><Trash2 className="w-3 h-3" /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Expenses Table */}
                                <div className="bg-slate-800 rounded-xl border border-rose-900/30 overflow-hidden shadow-xl flex flex-col h-[500px]">
                                    <div className="p-4 bg-rose-900/10 border-b border-rose-900/30">
                                        <h3 className="text-sm font-bold text-rose-200 uppercase tracking-wider">Movimientos de Salida (Caja)</h3>
                                    </div>
                                    <div className="overflow-y-auto flex-1">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-800 text-xs text-slate-500 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2">Hora</th>
                                                    <th className="px-4 py-2">Desc.</th>
                                                    <th className="px-4 py-2 text-right">Monto</th>
                                                    <th className="px-4 py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700/50">
                                                {filteredExpenses.map(exp => (
                                                    <tr key={exp.id} className="hover:bg-slate-700/20 text-sm">
                                                        <td className="px-4 py-2 text-slate-400 font-mono">{formatTime(exp.timestamp)}</td>
                                                        <td className="px-4 py-2 text-white truncate max-w-[150px]">{exp.description}</td>
                                                        <td className="px-4 py-2 text-right text-rose-400 font-bold">-{formatCurrency(exp.amount)}</td>
                                                        <td className="px-4 py-2 text-right">
                                                            <button onClick={() => setExpenseToDelete(exp.id)} className="text-slate-500 hover:text-rose-500"><Trash2 className="w-3 h-3" /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* HISTORY VIEW */}
            {view === 'HISTORY' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Fecha / Hora Cierre</th>
                                    <th className="px-6 py-4">Fondo Inicial</th>
                                    <th className="px-6 py-4">Ventas Totales</th>
                                    <th className="px-6 py-4">Gastos</th>
                                    <th className="px-6 py-4">Efectivo Sistema</th>
                                    <th className="px-6 py-4">Declarado</th>
                                    <th className="px-6 py-4">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {cashCuts.filter(c => c.status === 'CLOSED').length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-10 text-slate-500">No hay historial de cortes.</td></tr>
                                ) : (
                                    cashCuts.filter(c => c.status === 'CLOSED').map(cut => (
                                        <tr key={cut.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-white font-bold text-sm">{formatDate(cut.endTime!)}</div>
                                                <div className="text-xs text-slate-500">Abierto: {formatDate(cut.startTime)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">{formatCurrency(cut.initialCash)}</td>
                                            <td className="px-6 py-4 text-emerald-400">+{formatCurrency(cut.totalSalesCash + cut.totalSalesCard + cut.totalSalesTransfer)}</td>
                                            <td className="px-6 py-4 text-rose-400">-{formatCurrency(cut.totalExpenses)}</td>
                                            <td className="px-6 py-4 text-white font-bold">{formatCurrency(cut.finalCashSystem)}</td>
                                            <td className="px-6 py-4 text-blue-300">{formatCurrency(cut.finalCashDeclared)}</td>
                                            <td className={`px-6 py-4 font-bold ${cut.difference === 0 ? 'text-slate-500' : cut.difference > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {cut.difference > 0 ? '+' : ''}{formatCurrency(cut.difference)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CLOSE MODAL */}
            {showCloseModal && activeCashCut && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-white mb-1">Cerrar Caja</h3>
                        <p className="text-sm text-slate-400 mb-6">Cuenta el dinero físico e ingrésalo abajo.</p>

                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6 text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Efectivo Esperado (Sistema)</p>
                            <p className="text-3xl font-bold text-white">{formatCurrency(expectedCashInDrawer)}</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Efectivo Contado (Real)</label>
                            <input 
                                type="number" 
                                value={closeAmount}
                                onChange={(e) => setCloseAmount(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-lg font-bold outline-none focus:border-blue-500"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>

                        {closeAmount && (
                            <div className={`text-center mb-4 p-2 rounded ${Number(closeAmount) - expectedCashInDrawer === 0 ? 'bg-slate-700 text-slate-300' : Number(closeAmount) - expectedCashInDrawer > 0 ? 'bg-emerald-900/20 text-emerald-400' : 'bg-rose-900/20 text-rose-400'}`}>
                                Diferencia: {formatCurrency(Number(closeAmount) - expectedCashInDrawer)}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Notas (Opcional)</label>
                            <textarea 
                                value={closeNotes}
                                onChange={(e) => setCloseNotes(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-sm outline-none focus:border-blue-500 resize-none h-20"
                                placeholder="Ej. Se retiró billete roto..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowCloseModal(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium">Cancelar</button>
                            <button onClick={handleCloseRegister} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold shadow-lg shadow-rose-900/20">Confirmar Cierre</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Sale Confirmation */}
            {saleToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 text-rose-500 mb-4">
                            <div className="p-3 bg-rose-500/10 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">¿Eliminar Venta?</h3>
                        </div>
                        
                        <p className="text-slate-400 mb-6">
                            Esta acción eliminará el registro de venta permanentemente.
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

            {/* Other Modals */}
            {showAddExpenseModal && <ExpenseModal onClose={() => setShowAddExpenseModal(false)} />}
        </div>
    );
};

export default CashRegister;