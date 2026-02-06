import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { Wallet, CreditCard, Banknote, Package, Edit2, TrendingUp, ArrowRight, Save, X, Calendar } from 'lucide-react';

const Deposits: React.FC = () => {
    const { sales, expenses, businessSettings, updateBusinessSettings } = useCyber();
    
    // UI State for Editing Destination Names
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');

    // --- Timeframe Logic (Current Week Default) ---
    // Note: We use a simple Week Filter based on current date
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });

    const currentDate = new Date(selectedDate);
    const dayOfWeek = currentDate.getDay(); // 0 (Sun) - 6 (Sat)
    // Adjust to make Monday the start (if 0 (Sun), make it 7 for calc)
    const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    
    const startOfWeek = new Date(currentDate.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startTs = startOfWeek.getTime();
    const endTs = endOfWeek.getTime();

    // --- Calculations ---
    const weekSales = sales.filter(s => s.timestamp >= startTs && s.timestamp <= endTs);
    const weekExpenses = expenses.filter(e => e.timestamp >= startTs && e.timestamp <= endTs);

    // 1. Costo Mercancia (COGS)
    const totalCOGS = weekSales.reduce((acc, sale) => {
        return acc + sale.items.reduce((sAcc, item) => sAcc + ((item.costAtSale || 0) * item.quantity), 0);
    }, 0);

    // 2. Pagos Pendientes (Ventas Digitales - Dinero que no está en caja física)
    // Consideramos Tarjetas, CLIP, Transferencias como "Pendiente de depósito bancario"
    const digitalSales = weekSales
        .filter(s => s.paymentMethod !== 'CASH')
        .reduce((acc, s) => acc + s.total, 0);

    // 3. Efectivo Semana (Ventas Efectivo - Gastos)
    // Asumimos que los gastos salen de la caja chica (efectivo)
    const cashSales = weekSales
        .filter(s => s.paymentMethod === 'CASH')
        .reduce((acc, s) => acc + s.total, 0);
    
    const totalExpenses = weekExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netCash = cashSales - totalExpenses;

    // 4. Ahorro de Reparto (Profit Allocations)
    // Total Revenue - COGS - Expenses = Net Profit
    // This bucket represents the NET PROFIT available to be distributed/saved
    const totalRevenue = weekSales.reduce((acc, s) => acc + s.total, 0);
    const netProfit = totalRevenue - totalCOGS - totalExpenses;
    const savingsAmount = netProfit > 0 ? netProfit : 0; 
    // Note: If netProfit is negative, we show 0 savings available.

    // --- Handlers ---
    const handleEdit = (key: string, currentName: string) => {
        setEditingKey(key);
        setTempName(currentName);
    };

    const handleSave = (key: keyof typeof businessSettings.depositDestinations) => {
        if (businessSettings.depositDestinations) {
            updateBusinessSettings({
                ...businessSettings,
                depositDestinations: {
                    ...businessSettings.depositDestinations,
                    [key]: tempName
                }
            });
        }
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
        percentage 
    }: { 
        title: string, 
        amount: number, 
        destKey: 'pending' | 'savings' | 'cogs' | 'cash', 
        icon: any, 
        gradient: string,
        textColor: string,
        percentage?: string 
    }) => {
        const destName = businessSettings.depositDestinations?.[destKey] || 'Sin asignar';
        const isEditingThis = editingKey === destKey;

        return (
            <div className={`relative overflow-hidden rounded-2xl p-1 bg-gradient-to-br ${gradient} shadow-xl group transition-all hover:scale-[1.01]`}>
                <div className="bg-slate-900/90 h-full w-full rounded-xl p-6 backdrop-blur-sm flex flex-col justify-between relative z-10">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl bg-slate-800 border border-slate-700 ${textColor}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{title}</h3>
                                {percentage && <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">{percentage}</span>}
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Monto Actual</p>
                            <h2 className={`text-3xl font-bold ${amount < 0 ? 'text-rose-400' : 'text-white'}`}>
                                ${amount.toFixed(2)}
                            </h2>
                        </div>
                    </div>

                    {/* Progress Visual */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                        <div className={`h-full ${textColor.replace('text-', 'bg-')}`} style={{ width: '60%' }}></div>
                    </div>

                    {/* Footer / Destination */}
                    <div className="mt-auto pt-4 border-t border-slate-800/50 flex justify-between items-end">
                        <div className="flex-1">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                Transferir a <ArrowRight className="w-3 h-3" />
                            </p>
                            
                            {isEditingThis ? (
                                <div className="flex gap-2">
                                    <input 
                                        autoFocus
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white outline-none w-full"
                                    />
                                    <button onClick={() => handleSave(destKey)} className="p-1 bg-emerald-600 rounded hover:bg-emerald-500 text-white"><Save className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingKey(null)} className="p-1 bg-slate-700 rounded hover:bg-slate-600 text-white"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group/edit cursor-pointer" onClick={() => handleEdit(destKey, destName)}>
                                    <span className="text-sm font-medium text-slate-300 border-b border-dashed border-slate-600 pb-0.5 group-hover/edit:text-white group-hover/edit:border-slate-400 transition-colors">
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
                    <div className="text-sm text-slate-300 mr-2">
                        <span className="text-xs text-slate-500 uppercase font-bold block">Semana del</span>
                        {startOfWeek.toLocaleDateString()} al {endOfWeek.toLocaleDateString()}
                    </div>
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-slate-900 text-white border border-slate-600 rounded px-2 py-1 text-sm outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Pagos Pendientes (Digital Sales) */}
                <DepositCard 
                    title="Pagos Pendientes" 
                    amount={digitalSales} 
                    destKey="pending"
                    icon={CreditCard}
                    gradient="from-blue-600 to-indigo-600"
                    textColor="text-blue-400"
                    percentage="DIGITAL"
                />

                {/* 2. Ahorro de Reparto (Profit) */}
                <DepositCard 
                    title="Ahorro de Reparto" 
                    amount={savingsAmount} 
                    destKey="savings"
                    icon={TrendingUp}
                    gradient="from-purple-600 to-fuchsia-600"
                    textColor="text-purple-400"
                    percentage="UTILIDAD"
                />

                {/* 3. Costo de Mercancía (COGS) */}
                <DepositCard 
                    title="Costo de Mercancía" 
                    amount={totalCOGS} 
                    destKey="cogs"
                    icon={Package}
                    gradient="from-orange-600 to-amber-600"
                    textColor="text-orange-400"
                    percentage="REPOSICIÓN"
                />

                {/* 4. Efectivo Semana (Net Cash) */}
                <DepositCard 
                    title="Efectivo Semana" 
                    amount={netCash} 
                    destKey="cash"
                    icon={Banknote}
                    gradient="from-emerald-600 to-teal-600"
                    textColor="text-emerald-400"
                    percentage="CAJA"
                />

            </div>

            <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-center text-slate-400 text-sm">
                <p>Los montos se calculan automáticamente en base a las ventas y gastos registrados entre el <strong>{startOfWeek.toLocaleDateString()}</strong> y el <strong>{endOfWeek.toLocaleDateString()}</strong>.</p>
            </div>
        </div>
    );
};

export default Deposits;