import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { ServiceOrder, OrderStatus } from '../types';
import { Search, Plus, Wrench, CheckCircle, Clock, XCircle, FileText, AlertTriangle, Package, Edit, Trash2 } from 'lucide-react';
import ServiceOrderModal from './ServiceOrderModal';

const ServiceOrdersManager: React.FC = () => {
    const { serviceOrders, deleteServiceOrder } = useCyber();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState<OrderStatus | 'ALL'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<ServiceOrder | undefined>(undefined);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    // Filter Logic
    const filteredOrders = serviceOrders.filter(order => {
        const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              order.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              order.deviceType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = activeStatus === 'ALL' || order.status === activeStatus;
        return matchesSearch && matchesStatus;
    }).sort((a,b) => b.entryDate - a.entryDate); // Newest first

    // Status Tab Config
    const statusTabs = [
        { id: OrderStatus.PENDING, label: 'En Revisión', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-900/20', border: 'border-amber-500/30' },
        { id: OrderStatus.APPROVED, label: 'Aprobado', icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-500/30' },
        { id: OrderStatus.IN_PROGRESS, label: 'En Reparación', icon: Wrench, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30' },
        { id: OrderStatus.REPAIRED, label: 'Reparado', icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-500/30' },
        { id: OrderStatus.NOT_REPAIRED, label: 'No Reparado', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30' },
        { id: OrderStatus.DELIVERED, label: 'Entregado', icon: FileText, color: 'text-slate-300', bg: 'bg-slate-700/50', border: 'border-slate-500/30' },
        { id: OrderStatus.CANCELLED, label: 'Cancelado', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-900/20', border: 'border-rose-500/30' },
    ];

    const handleEdit = (order: ServiceOrder) => {
        setOrderToEdit(order);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setOrderToEdit(undefined);
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        if (orderToDelete) {
            deleteServiceOrder(orderToDelete);
            setOrderToDelete(null);
        }
    };

    const formatDate = (ts: number) => new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

    // Helper to get status visual
    const getStatusVisual = (status: OrderStatus) => {
        const config = statusTabs.find(t => t.id === status);
        if (!config) return <span className="text-white">Desconocido</span>;
        
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-fit ${config.bg} ${config.color} border ${config.border}`}>
                <config.icon className="w-3 h-3" /> {config.label}
            </span>
        );
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Órdenes de Servicio</h2>
                    <p className="text-slate-400">Control de reparaciones y garantías</p>
                </div>
                <div className="flex gap-3">
                     <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar folio, cliente..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white pl-9 pr-4 py-2.5 rounded-lg outline-none focus:border-blue-500" 
                        />
                    </div>
                    <button 
                        onClick={handleNew}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-5 h-5" /> Nueva Orden
                    </button>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-thin scrollbar-thumb-slate-700">
                <button
                    onClick={() => setActiveStatus('ALL')}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeStatus === 'ALL' ? 'bg-slate-200 text-slate-900 border-white' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                >
                    Todas
                </button>
                {statusTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveStatus(tab.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap flex items-center gap-2 transition-all border ${
                            activeStatus === tab.id 
                            ? `${tab.bg} ${tab.color} border-current` 
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-slate-900/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Folio / Fecha</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Equipo / Falla</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4">Costos</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                                    No se encontraron órdenes.
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map(order => {
                                const remaining = (order.finalCost > 0 ? order.finalCost : order.estimatedCost) - order.advancePayment;
                                return (
                                    <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white text-lg">{order.folio}</div>
                                            <div className="text-xs text-slate-500">{formatDate(order.entryDate)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{order.customerName}</div>
                                            <div className="text-xs text-slate-500">{order.customerPhone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-300">{order.deviceType} - {order.brand}</div>
                                            <div className="text-xs text-slate-500 line-clamp-1 max-w-[200px]" title={order.problemDescription}>
                                                {order.problemDescription}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusVisual(order.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-white">Total: ${order.finalCost > 0 ? order.finalCost : order.estimatedCost}</div>
                                            {remaining > 0 ? (
                                                <div className="text-xs text-rose-400 font-bold">Resta: ${remaining}</div>
                                            ) : (
                                                <div className="text-xs text-emerald-400 font-bold">Pagado</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(order)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setOrderToDelete(order.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <ServiceOrderModal 
                    onClose={() => setIsModalOpen(false)} 
                    orderToEdit={orderToEdit} 
                />
            )}

            {/* Delete Confirmation Modal */}
            {orderToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 text-rose-500 mb-4">
                            <div className="p-3 bg-rose-500/10 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">¿Eliminar Orden?</h3>
                        </div>
                        
                        <p className="text-slate-400 mb-6">
                            Esta acción eliminará el registro de la orden de servicio permanentemente. No se puede deshacer.
                        </p>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setOrderToDelete(null)}
                                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-900/20"
                            >
                                <Trash2 className="w-4 h-4" /> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceOrdersManager;