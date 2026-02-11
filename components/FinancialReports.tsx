import React, { useState, useMemo } from 'react';
import { useCyber } from '../context/CyberContext';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, ChevronDown, Activity, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

// Helpers
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const FinancialReports: React.FC = () => {
    const { sales, expenses } = useCyber();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // --- Data Processing ---
    
    // 1. Get available years
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        years.add(new Date().getFullYear());
        sales.forEach(s => years.add(new Date(s.timestamp).getFullYear()));
        return Array.from(years).sort((a,b) => b - a);
    }, [sales]);

    // 2. Aggregate Monthly Data for Charts
    const monthlyData = useMemo(() => {
        const data = Array(12).fill(0).map((_, i) => ({ 
            monthIndex: i, 
            monthName: MONTHS[i], 
            income: 0, 
            expense: 0,
            profit: 0
        }));

        sales.forEach(s => {
            const d = new Date(s.timestamp);
            if (d.getFullYear() === selectedYear) {
                data[d.getMonth()].income += s.total;
            }
        });

        expenses.forEach(e => {
            const d = new Date(e.timestamp);
            if (d.getFullYear() === selectedYear) {
                data[d.getMonth()].expense += e.amount;
            }
        });

        // Calculate Profit
        data.forEach(d => d.profit = d.income - d.expense);

        return data;
    }, [sales, expenses, selectedYear]);

    // 3. Aggregate Weekly Data (ISO Weeksish)
    const weeklyData = useMemo(() => {
        const weeks: Record<number, { week: number, start: Date, end: Date, income: 0, expense: 0, profit: 0 }> = {};
        
        const processItem = (ts: number, amount: number, type: 'income' | 'expense') => {
            const d = new Date(ts);
            if (d.getFullYear() !== selectedYear) return;
            
            // Simple Week Number calc
            const startOfYear = new Date(d.getFullYear(), 0, 1);
            const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
            const weekNumber = Math.ceil((days + 1) / 7);

            if (!weeks[weekNumber]) {
                const weekStart = new Date(d.getFullYear(), 0, 1 + (weekNumber - 1) * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weeks[weekNumber] = { week: weekNumber, start: weekStart, end: weekEnd, income: 0, expense: 0, profit: 0 };
            }
            if (type === 'income') weeks[weekNumber].income += amount;
            else weeks[weekNumber].expense += amount;
        };

        sales.forEach(s => processItem(s.timestamp, s.total, 'income'));
        expenses.forEach(e => processItem(e.timestamp, e.amount, 'expense'));

        return Object.values(weeks).map(w => ({ ...w, profit: w.income - w.expense })).sort((a,b) => b.week - a.week);
    }, [sales, expenses, selectedYear]);

    // 4. Yearly Totals
    const yearTotals = monthlyData.reduce((acc, curr) => ({
        income: acc.income + curr.income,
        expense: acc.expense + curr.expense,
        profit: acc.profit + curr.profit
    }), { income: 0, expense: 0, profit: 0 });

    const profitMargin = yearTotals.income > 0 ? (yearTotals.profit / yearTotals.income) * 100 : 0;

    // --- Chart Scaling ---
    const maxChartValue = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)), 100);

    return (
        <div className="p-8 h-full overflow-y-auto bg-slate-900 text-slate-100">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-indigo-500" />
                        Reportes Financieros
                    </h2>
                    <p className="text-slate-400 mt-1">Análisis detallado de ingresos y egresos.</p>
                </div>
                
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 outline-none font-bold"
                    >
                        {availableYears.map(y => (
                            <option key={y} value={y}>Año {y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                
                {/* Income */}
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> Entradas
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Ingresos Totales ({selectedYear})</p>
                    <h3 className="text-3xl font-bold text-white mt-1">${yearTotals.income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                </div>

                {/* Expenses */}
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="flex items-center text-xs font-medium text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full">
                            <ArrowDownRight className="w-3 h-3 mr-1" /> Salidas
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Gastos Totales ({selectedYear})</p>
                    <h3 className="text-3xl font-bold text-white mt-1">${yearTotals.expense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                </div>

                {/* Net Profit */}
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <Wallet className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Ganancia Neta Anual</p>
                    <h3 className={`text-3xl font-bold mt-1 ${yearTotals.profit >= 0 ? 'text-white' : 'text-rose-400'}`}>
                        ${yearTotals.profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </h3>
                </div>

                {/* Margin */}
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Margen de Utilidad</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{profitMargin.toFixed(1)}%</h3>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Balance Mensual</h3>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                            <span className="text-slate-400">Ingresos</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                            <span className="text-slate-400">Gastos</span>
                        </div>
                    </div>
                </div>

                <div className="h-64 w-full flex items-end gap-2 sm:gap-4 relative">
                    {/* Background Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                        <div className="border-t border-slate-400 w-full h-0"></div>
                        <div className="border-t border-slate-400 w-full h-0"></div>
                        <div className="border-t border-slate-400 w-full h-0"></div>
                        <div className="border-t border-slate-400 w-full h-0"></div>
                        <div className="border-t border-slate-400 w-full h-0"></div>
                    </div>

                    {monthlyData.map((data) => {
                        const incomeHeight = maxChartValue > 0 ? (data.income / maxChartValue) * 100 : 0;
                        const expenseHeight = maxChartValue > 0 ? (data.expense / maxChartValue) * 100 : 0;

                        return (
                            <div key={data.monthIndex} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-600 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-32 text-center pointer-events-none">
                                    <p className="font-bold mb-1">{data.monthName}</p>
                                    <p className="text-emerald-400">Ing: ${data.income.toLocaleString()}</p>
                                    <p className="text-rose-400">Gas: ${data.expense.toLocaleString()}</p>
                                    <p className="text-blue-300 border-t border-slate-700 mt-1 pt-1">Net: ${data.profit.toLocaleString()}</p>
                                </div>

                                <div className="w-full flex justify-center items-end gap-1 h-full px-1">
                                    <div 
                                        className="w-full max-w-[20px] bg-emerald-500 rounded-t-sm hover:bg-emerald-400 transition-all duration-500"
                                        style={{ height: `${Math.max(incomeHeight, 1)}%` }}
                                    ></div>
                                    <div 
                                        className="w-full max-w-[20px] bg-rose-500 rounded-t-sm hover:bg-rose-400 transition-all duration-500"
                                        style={{ height: `${Math.max(expenseHeight, 1)}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-slate-500 mt-2 font-medium">{data.monthName}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Split View: Weekly Breakdown & Detailed Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Weekly Trend */}
                <div className="lg:col-span-1 bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl flex flex-col h-[500px]">
                    <h3 className="text-xl font-bold text-white mb-4">Tendencia Semanal</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {weeklyData.map((week) => (
                            <div key={week.week} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-white">Semana {week.week}</span>
                                    <span className={`text-sm font-bold ${week.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        ${week.profit.toLocaleString('es-MX')}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 flex justify-between">
                                    <span>{week.start.toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})} - {week.end.toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})}</span>
                                    <span>Mg: {week.income > 0 ? ((week.profit/week.income)*100).toFixed(0) : 0}%</span>
                                </div>
                                {/* Mini Bar */}
                                <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden flex">
                                    <div className="h-full bg-emerald-500" style={{ width: `${week.income > 0 ? Math.min((week.profit / (week.income || 1)) * 100, 100) : 0}%` }}></div>
                                </div>
                            </div>
                        ))}
                        {weeklyData.length === 0 && (
                            <div className="text-center text-slate-500 mt-10">No hay datos para este año.</div>
                        )}
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl flex flex-col h-[500px]">
                    <h3 className="text-xl font-bold text-white mb-4">Estado de Resultados Mensual</h3>
                    <div className="flex-1 overflow-y-auto rounded-lg border border-slate-700">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4">Mes</th>
                                    <th className="px-6 py-4 text-right text-emerald-500">Ingresos</th>
                                    <th className="px-6 py-4 text-right text-rose-500">Gastos</th>
                                    <th className="px-6 py-4 text-right text-blue-400">Utilidad</th>
                                    <th className="px-6 py-4 text-right">Margen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {monthlyData.map((data) => (
                                    <tr key={data.monthIndex} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{data.monthName}</td>
                                        <td className="px-6 py-4 text-right text-slate-300">${data.income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-right text-slate-300">${data.expense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            ${data.profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 text-xs">
                                            {data.income > 0 ? ((data.profit / data.income) * 100).toFixed(1) : '0.0'}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-900 font-bold border-t-2 border-slate-600 sticky bottom-0">
                                <tr>
                                    <td className="px-6 py-4 text-white">TOTAL ANUAL</td>
                                    <td className="px-6 py-4 text-right text-emerald-400">${yearTotals.income.toLocaleString('es-MX')}</td>
                                    <td className="px-6 py-4 text-right text-rose-400">${yearTotals.expense.toLocaleString('es-MX')}</td>
                                    <td className="px-6 py-4 text-right text-blue-400">${yearTotals.profit.toLocaleString('es-MX')}</td>
                                    <td className="px-6 py-4 text-right text-slate-400">{profitMargin.toFixed(1)}%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FinancialReports;