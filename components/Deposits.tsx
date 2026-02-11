import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { Wallet, CreditCard, Banknote, Package, Edit2, TrendingUp, ArrowRight, Save, X, Calendar, RotateCcw, AlertCircle, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from 'lucide-react';

const Deposits: React.FC = () => {
    const { sales, expenses, businessSettings, updateBusinessSettings } = useCyber();
    
    // UI State for Editing Destination Names
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    
    // Modal State
    const [showCashSummary, setShowCashSummary] = useState(false);

    // --- Timeframe Logic (Current Week Default - Local Time) ---
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        // Return YYYY-MM-DD local
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    // Precise Local Time Calculation for Week Range
    const [year, month, day] = selectedDate.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day); // Local midnight
    
    const dayOfWeek = currentDate.getDay(); // 0 (Sun) - 6 (Sat)
    
    // Start of Week is SATURDAY (6)
    const daysSinceSaturday = (dayOfWeek + 1) % 7;
    
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - daysSinceSaturday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // End of Week is FRIDAY (+6 days from Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startTs = startOfWeek.getTime();
    const endTs = endOfWeek.getTime();

    // --- Base Calculations ---
    // FORCE NUMBER CONVERSION for timestamps to ensure strict filtering
    const weekSales = sales.filter(s => Number(s.timestamp) >= startTs && Number(s.timestamp) <= endTs);
    const weekExpenses = expenses.filter(e => Number(e.timestamp) >= startTs && Number(e.timestamp) <= endTs);

    const totalRevenue = weekSales.reduce((acc, s) => acc + s.total, 0);
    
    // Costo Mercancia (COGS)
    const totalCOGS = weekSales.reduce((acc, sale) => {
        return acc + sale.items.reduce((sAcc, item) => sAcc + ((item.costAtSale || 0) * item.quantity), 0);
    }, 0);

    const totalExpenses = weekExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    // Net Profit for Distribution (Accounting Profit)
    const netProfit = totalRevenue - totalCOGS - totalExpenses;

    // --- Advanced Logic: Map to Distribution Rules ---
    const findRule = (keywords: string[]) => {
        return businessSettings.distributionRules?.find(r => 
            keywords.some(k => r.name.toLowerCase().includes(k.toLowerCase()))
        );
    };

    // 1. Pagos Pendientes
    // Priority: Distribution Rule "Pendientes" -> Fallback: Digital Sales
    const rulePending = findRule(['Pendientes', 'Pagos Pendientes']);
    const digitalSales = weekSales.filter(s => s.paymentMethod !== 'CASH').reduce((acc, s) => acc + s.total, 0);
    
    const valPending = rulePending ? (netProfit > 0 ? netProfit * (rulePending.percentage / 100) : 0) : digitalSales;
    const subPending = rulePending 
        ? `Basado en regla de reparto (${rulePending.percentage}%).` 
        : 'Ventas digitales (Tarjeta, CLIP).';
    const tagPending = rulePending ? `${rulePending.percentage}% REPARTO` : 'DIGITAL';

    // 2. Ahorro de Reparto
    // Priority: Distribution Rule "Ahorro" -> Fallback: 0
    const ruleSavings = findRule(['Ahorro', 'Fondo']);
    const valSavings = ruleSavings ? (netProfit > 0 ? netProfit * (ruleSavings.percentage / 100) : 0) : 0;
    const subSavings = ruleSavings 
        ? `Basado en regla de reparto (${ruleSavings.percentage}%).` 
        : 'Sin regla de ahorro configurada.';
    const tagSavings = ruleSavings ? `${ruleSavings.percentage}% REPARTO` : 'SIN CONFIG';

    // 3. Efectivo Semana
    // Priority: Distribution Rule "Efectivo" -> Fallback: Physical Cash in Drawer
    const ruleCash = findRule(['Efectivo', 'Sueldos', 'Ganancia']);
    
    // Calculate Breakdown for Summary Modal
    const cashSalesTotal = weekSales.filter(s => s.paymentMethod === 'CASH').reduce((acc, s) => acc + s.total, 0);
    const transferSalesTotal = weekSales.filter(s => s.paymentMethod === 'TRANSFER').reduce((acc, s) => acc + s.total, 0);
    const cardSalesTotal = weekSales.filter(s => s.paymentMethod === 'CARD' || s.paymentMethod === 'CLIP').reduce((acc, s) => acc + s.total, 0);
    
    const cashExpensesTotal = weekExpenses.filter(e => e.affectsCashBox !== false).reduce((acc, e) => acc + e.amount, 0);
    const nonCashExpensesTotal = weekExpenses.filter(e => e.affectsCashBox === false).reduce((acc, e) => acc + e.amount, 0);

    const netPhysicalCash = cashSalesTotal - cashExpensesTotal;

    const valCash = ruleCash ? (netProfit > 0 ? netProfit * (ruleCash.percentage / 100) : 0) : netPhysicalCash;
    const subCash = ruleCash 
        ? `Basado en regla de reparto (${ruleCash.percentage}%).` 
        : 'Clic para ver desglose detallado.';
    const tagCash = ruleCash ? `${ruleCash.percentage}% REPARTO` : 'CAJA FÍSICA';


    // --- Handlers ---
    const handleEdit = (key: string, currentName: string) => {
        setEditingKey(key);
        setTempName(currentName);
    };

    const handleSave = (key: string) => {
        const currentDestinations = businessSettings.depositDestinations || {
            pending: 'Cuenta Bancaria Principal',
            savings: 'Cuenta de Ahorro / Inversión',
            cogs: 'Cuenta de Recompra',
            cash: 'Caja Chica / Efectivo'
        };

        updateBusinessSettings({
            ...businessSettings,
            depositDestinations: {
                ...currentDestinations,
                [key]: tempName
            }
        });
        setEditingKey(null);
    };

    // Helper for Card Rendering
    const DepositCard = ({ 
        title, 
        amount, 
        destKey, 
        icon: Icon, 
        gradient, 
        textColor, 
        percentageTag,
        subtitle,
        onClick
    }: { 
        title: string, 
        amount: number, 
        destKey: 'pending' | 'savings' | 'cogs' | 'cash', 
        icon: any, 
        gradient: string,
        textColor: string,
        percentageTag?: string,
        subtitle?: string,
        onClick?: () => void
    }) => {
        const destName = businessSettings.depositDestinations?.[destKey] || 'Sin asignar';
        const isEditingThis = editingKey === destKey;

        return (
            <div 
                onClick={onClick}
                className={`relative overflow-hidden rounded-2xl p-1 bg-gradient-to-br ${gradient} shadow-xl group transition-all hover:scale-[1.01] ${onClick ? 'cursor-pointer' : ''}`}
            >
                <div className="bg-slate-900/90 h-full w-full rounded-xl p-6 backdrop-blur-sm flex flex-col justify-between relative z-10">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl bg-slate-800 border border-slate-700 ${textColor}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
                                {percentageTag && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wide mt-1 inline-block">{percentageTag}</span>}
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Monto Semana</p>
                            <h2 className={`text-3xl font-bold ${amount < 0 ? 'text-rose-400' : 'text-white'}`}>
                                ${amount.toFixed(2)}
                            </h2>
                        </div>
                    </div>

                    {/* Progress Visual */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mb-2 overflow-hidden">
                        <div className={`h-full ${textColor.replace('text-', 'bg-')}`} style={{ width: '60%' }}></div>
                    </div>
                    
                    {subtitle && (
                        <p className="text-xs text-slate-400 mb-4 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {subtitle}
                        </p>
                    )}

                    {/* Footer / Destination */}
                    <div className="mt-auto pt-4 border-t border-slate-800/50 flex justify-between items-end">
                        <div className="flex-1">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                Transferir a <ArrowRight className="w-3 h-3" />
                            </p>
                            
                            {isEditingThis ? (
                                <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                                    <input 
                                        autoFocus
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white outline-none w-full shadow-inner"
                                        placeholder="Nombre de cuenta..."
                                    />
                                    <button onClick={() => handleSave(destKey)} className="p-1.5 bg-emerald-600 rounded hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20" title="Guardar"><Save className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingKey(null)} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 text-white" title="Cancelar"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group/edit cursor-pointer select-none" onClick={(e) => { e.stopPropagation(); handleEdit(destKey, destName); }}>
                                    <span className={`text-sm font-medium border-b border-dashed pb-0.5 transition-colors ${destName === 'Sin asignar' ? 'text-slate-500 border-slate-600 italic' : 'text-slate-200 border-slate-500 group-hover/edit:text-white'}`}>
                                        {destName}
                                    </span>
                                    <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Background Deco */}
                    <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 blur-2xl ${textColor.replace('text-', 'bg-')}`}></div>
                </div>
            </div>
        );
    };

    return (
        <>
        <div className="p-8 h-full overflow-y-auto bg-slate-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-indigo-500" />
                        Control de Depósitos
                    </h2>
                    <p className="text-slate-400 mt-1">Gestión visual de flujos de efectivo para transferencias semanales.</p>
                </div>
                
                <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 flex items-center gap-3">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Pagos Pendientes */}
                <DepositCard 
                    title="Pagos Pendientes" 
                    amount={valPending} 
                    destKey="pending"
                    icon={CreditCard}
                    gradient="from-blue-600 to-indigo-600"
                    textColor="text-blue-400"
                    percentageTag={tagPending}
                    subtitle={subPending}
                />

                {/* 2. Ahorro de Reparto */}
                <DepositCard 
                    title="Ahorro de Reparto" 
                    amount={valSavings} 
                    destKey="savings"
                    icon={TrendingUp}
                    gradient="from-purple-600 to-fuchsia-600"
                    textColor="text-purple-400"
                    percentageTag={tagSavings}
                    subtitle={subSavings}
                />

                {/* 3. Costo de Mercancía (COGS) */}
                <DepositCard 
                    title="Costo de Mercancía" 
                    amount={totalCOGS} 
                    destKey="cogs"
                    icon={Package}
                    gradient="from-orange-600 to-amber-600"
                    textColor="text-orange-400"
                    percentageTag="REPOSICIÓN"
                    subtitle="Capital necesario para reponer stock vendido."
                />

                {/* 4. Efectivo Semana */}
                <DepositCard 
                    title="Efectivo Semana" 
                    amount={valCash} 
                    destKey="cash"
                    icon={Banknote}
                    gradient="from-emerald-600 to-teal-600"
                    textColor="text-emerald-400"
                    percentageTag={tagCash}
                    subtitle={subCash}
                    onClick={() => setShowCashSummary(true)}
                />

            </div>

            <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-center text-slate-400 text-sm">
                <p>
                    <strong>Nota:</strong> Los módulos de <em>Pagos Pendientes</em>, <em>Ahorro</em> y <em>Efectivo</em> intentarán coincidir con tus reglas de distribución (por nombre) en la sección Distribución. 
                    Si no coinciden, se usarán cálculos estándar (Ventas Digitales, 0, Caja Física).
                </p>
            </div>
        </div>

        {/* --- WEEKLY SUMMARY MODAL --- */}
        {showCashSummary && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="bg-emerald-700 p-5 flex justify-between items-center rounded-t-2xl">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Banknote className="w-6 h-6" /> Resumen de Flujo Semanal
                        </h3>
                        <button onClick={() => setShowCashSummary(false)} className="text-emerald-100 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        
                        <p className="text-center text-slate-400 text-sm">
                            Desglose de movimientos del <strong>{startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</strong> al <strong>{endOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</strong>.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {/* CAJA (Cash Sales) */}
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold text-sm">
                                    <ArrowUpCircle className="w-4 h-4" /> Ingreso Efectivo
                                </div>
                                <p className="text-2xl font-bold text-white">${cashSalesTotal.toFixed(2)}</p>
                                <p className="text-xs text-slate-500 mt-1">Ventas en mostrador</p>
                            </div>

                            {/* TRANSFERENCIAS */}
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2 text-blue-400 mb-2 font-bold text-sm">
                                    <ArrowRightLeft className="w-4 h-4" /> Transferencias
                                </div>
                                <p className="text-2xl font-bold text-white">${transferSalesTotal.toFixed(2)}</p>
                                <p className="text-xs text-slate-500 mt-1">Directo a Banco</p>
                            </div>

                            {/* TARJETA (If any) */}
                            {cardSalesTotal > 0 && (
                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 col-span-2 md:col-span-1">
                                    <div className="flex items-center gap-2 text-indigo-400 mb-2 font-bold text-sm">
                                        <CreditCard className="w-4 h-4" /> Tarjeta / Clip
                                    </div>
                                    <p className="text-2xl font-bold text-white">${cardSalesTotal.toFixed(2)}</p>
                                </div>
                            )}

                            {/* GASTOS TOTALES */}
                            <div className={`bg-slate-800 p-4 rounded-xl border border-slate-700 ${cardSalesTotal > 0 ? 'col-span-2 md:col-span-1' : 'col-span-2'}`}>
                                <div className="flex items-center gap-2 text-rose-400 mb-2 font-bold text-sm">
                                    <ArrowDownCircle className="w-4 h-4" /> Gastos Totales
                                </div>
                                <p className="text-2xl font-bold text-white">-${(cashExpensesTotal + nonCashExpensesTotal).toFixed(2)}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">Caja: ${cashExpensesTotal.toFixed(0)}</span>
                                    <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">Otros: ${nonCashExpensesTotal.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* FINAL BALANCE BOX */}
                        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-xl p-5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-emerald-200 font-bold uppercase text-xs tracking-wider">Dinero Físico en Caja (Estimado)</span>
                                <Wallet className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">
                                ${(cashSalesTotal - cashExpensesTotal).toFixed(2)}
                            </div>
                            <p className="text-xs text-emerald-400/60 border-t border-emerald-500/20 pt-2">
                                = Ventas Efectivo (${cashSalesTotal.toFixed(0)}) - Gastos de Caja (${cashExpensesTotal.toFixed(0)})
                            </p>
                        </div>

                    </div>

                    <div className="p-4 bg-slate-800 rounded-b-2xl border-t border-slate-700 flex justify-end">
                        <button 
                            onClick={() => setShowCashSummary(false)}
                            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default Deposits;