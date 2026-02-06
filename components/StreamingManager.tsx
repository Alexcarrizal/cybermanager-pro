import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { Tv, AlertTriangle, Calendar, Clock, ChevronRight, Plus, Settings, MessageCircle, Edit, Trash2, Search, PlayCircle, StickyNote, RefreshCw } from 'lucide-react';
import StreamingPlatformModal from './StreamingPlatformModal';
import StreamingSaleModal from './StreamingSaleModal';
import StreamingNotesModal from './StreamingNotesModal';
import StreamingRenewModal from './StreamingRenewModal';
import { StreamingAccount } from '../types';

const StreamingManager: React.FC = () => {
    const { streamingAccounts, streamingPlatforms, streamingDistributors, deleteStreamingAccount } = useCyber();
    
    // Modals state
    const [showPlatformModal, setShowPlatformModal] = useState(false);
    const [showSaleModal, setShowSaleModal] = useState(false);
    
    // Action Modals
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showRenewModal, setShowRenewModal] = useState(false);
    
    // Selection state
    const [accountToEdit, setAccountToEdit] = useState<StreamingAccount | undefined>(undefined);
    const [selectedAccount, setSelectedAccount] = useState<StreamingAccount | null>(null); // For notes/renew
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');

    // Helpers
    const getPlatform = (id: string) => streamingPlatforms.find(p => p.id === id);
    
    const now = Date.now();
    
    // Derived Stats
    const activeAccounts = streamingAccounts.filter(a => a.expirationDate > now && !a.isTrial);
    const expiredAccounts = streamingAccounts.filter(a => a.expirationDate <= now && !a.isTrial);
    const trialAccounts = streamingAccounts.filter(a => a.isTrial);
    
    // Expiring in next 3 days
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const expiringSoon = activeAccounts.filter(a => (a.expirationDate - now) < threeDaysMs);
    
    // Revenue
    const totalRevenue = streamingAccounts.filter(a => !a.isTrial).reduce((acc, curr) => acc + curr.price, 0);

    // Filter Logic
    const filteredAccounts = streamingAccounts.filter(acc => 
        acc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        getPlatform(acc.platformId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.accountEmail.includes(searchTerm)
    ).sort((a,b) => a.expirationDate - b.expirationDate);

    // Date formatter
    const formatDate = (ts: number) => new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Status helpers
    const getDaysRemaining = (expDate: number) => {
        const diff = expDate - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const getStatusBadge = (acc: any) => {
        const days = getDaysRemaining(acc.expirationDate);
        if (days < 0) return <span className="flex items-center gap-2 text-rose-400 text-sm font-medium"><AlertTriangle className="w-4 h-4" /> Expiró hace {Math.abs(days)} días</span>;
        if (days === 0) return <span className="flex items-center gap-2 text-amber-400 text-sm font-medium"><Clock className="w-4 h-4" /> Expira hoy</span>;
        if (days <= 3) return <span className="flex items-center gap-2 text-amber-400 text-sm font-medium"><Clock className="w-4 h-4" /> Expira en {days} días</span>;
        return <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium"><Calendar className="w-4 h-4" /> {days} días restantes</span>;
    }

    const handleWhatsapp = (phone: string | undefined, acc: any) => {
        if (!phone) {
             alert('Este cliente no tiene número de teléfono registrado.');
             return;
        }
        const days = getDaysRemaining(acc.expirationDate);
        const platformName = getPlatform(acc.platformId)?.name || 'su cuenta';
        let msg = '';
        if (days < 0) msg = `Hola ${acc.customerName}, su cuenta de ${platformName} ha vencido. ¿Desea renovar?`;
        else if (days <= 3) msg = `Hola ${acc.customerName}, recordatorio: su cuenta de ${platformName} vence en ${days} días.`;
        else msg = `Hola ${acc.customerName}, gracias por su compra de ${platformName}.`;
        
        window.open(`https://wa.me/521${phone.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    const handleEditClick = (acc: StreamingAccount) => {
        setAccountToEdit(acc);
        setShowSaleModal(true);
    }

    const handleNotesClick = (acc: StreamingAccount) => {
        setSelectedAccount(acc);
        setShowNotesModal(true);
    }

    const handleRenewClick = (acc: StreamingAccount) => {
        setSelectedAccount(acc);
        setShowRenewModal(true);
    }

    const handleNewSaleClick = () => {
        setAccountToEdit(undefined);
        setShowSaleModal(true);
    }

    const confirmDelete = () => {
        if (accountToDelete) {
            deleteStreamingAccount(accountToDelete);
            setAccountToDelete(null);
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
                <h2 className="text-3xl font-bold text-white">Gestor de Cuentas Streaming</h2>
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={() => setShowPlatformModal(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all"
                    >
                        <Settings className="w-5 h-5" /> Gestionar
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white pl-9 pr-4 py-2.5 rounded-lg outline-none focus:border-orange-500" 
                        />
                    </div>
                    <button 
                        onClick={handleNewSaleClick}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-5 h-5" /> Nueva Venta
                    </button>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center relative overflow-hidden">
                    <div>
                        <p className="text-slate-400 text-xs font-medium mb-1">Cuentas Activas</p>
                        <h3 className="text-2xl font-bold text-white">{activeAccounts.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                    </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center relative overflow-hidden">
                    <div>
                        <p className="text-slate-400 text-xs font-medium mb-1">Por Expirar</p>
                        <h3 className="text-2xl font-bold text-white">{expiringSoon.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center relative overflow-hidden">
                    <div>
                        <p className="text-slate-400 text-xs font-medium mb-1">Expiradas</p>
                        <h3 className="text-2xl font-bold text-white">{expiredAccounts.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                    </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center relative overflow-hidden">
                    <div>
                        <p className="text-slate-400 text-xs font-medium mb-1">Cuentas de Prueba</p>
                        <h3 className="text-2xl font-bold text-white">{trialAccounts.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <PlayCircle className="w-5 h-5 text-cyan-500" />
                    </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center relative overflow-hidden col-span-2">
                    <div>
                        <p className="text-slate-400 text-xs font-medium mb-1">Ganancia Estimada (Total Histórico)</p>
                        <h3 className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/20 transition-colors">
                        <ChevronRight className="w-5 h-5 text-indigo-500" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                <div className="p-4 bg-slate-800 border-b border-slate-700">
                    <h3 className="text-lg font-bold text-white">Cuentas de Streaming</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Plataforma</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Credenciales</th>
                                <th className="px-6 py-4">Precio / Costo</th>
                                <th className="px-6 py-4">Vencimiento</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredAccounts.map(acc => {
                                const platform = getPlatform(acc.platformId);
                                const hasNotes = acc.notes && acc.notes.trim().length > 0;
                                
                                return (
                                    <tr key={acc.id} className="hover:bg-slate-700/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            {getStatusBadge(acc)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                                    {platform?.name.substring(0,2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">{platform?.name}</div>
                                                    <div className="text-xs text-slate-500">{platform?.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white text-sm">{acc.customerName}</div>
                                            <div className="text-xs text-slate-500">{acc.customerPhone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs font-mono text-slate-300 bg-slate-900/50 px-2 py-1 rounded w-fit select-all">
                                                    {acc.accountEmail}
                                                </div>
                                                {acc.profileName && (
                                                    <div className="text-xs text-blue-400">
                                                        Perfil: {acc.profileName} {acc.pin ? `(PIN: ${acc.pin})` : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-emerald-400 font-bold text-sm">${acc.price.toFixed(2)}</div>
                                            <div className="text-slate-500 text-xs">Costo: ${acc.cost.toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                                            {formatDate(acc.expirationDate)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button 
                                                    onClick={() => handleNotesClick(acc)}
                                                    className={`p-2 rounded-lg transition-colors relative ${hasNotes ? 'text-amber-400 bg-amber-900/10 hover:bg-amber-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                                    title={hasNotes ? "Ver notas" : "Agregar nota"}
                                                >
                                                    <StickyNote className="w-4 h-4" />
                                                    {hasNotes && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>}
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleRenewClick(acc)}
                                                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-900/20 rounded-lg transition-colors"
                                                    title="Renovar cuenta"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>

                                                <button 
                                                    onClick={() => handleWhatsapp(acc.customerPhone, acc)}
                                                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                    title="Enviar WhatsApp"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleEditClick(acc)}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => setAccountToDelete(acc.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredAccounts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                                        No se encontraron cuentas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showPlatformModal && <StreamingPlatformModal onClose={() => setShowPlatformModal(false)} />}
            
            {showSaleModal && (
                <StreamingSaleModal 
                    onClose={() => setShowSaleModal(false)} 
                    accountToEdit={accountToEdit}
                />
            )}

            {showNotesModal && selectedAccount && (
                <StreamingNotesModal 
                    account={selectedAccount}
                    onClose={() => setShowNotesModal(false)}
                />
            )}

            {showRenewModal && selectedAccount && (
                <StreamingRenewModal 
                    account={selectedAccount}
                    onClose={() => setShowRenewModal(false)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {accountToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 text-rose-500 mb-4">
                            <div className="p-3 bg-rose-500/10 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">¿Eliminar Cuenta?</h3>
                        </div>
                        
                        <p className="text-slate-400 mb-6">
                            Esta acción eliminará el registro de la cuenta de streaming. No se puede deshacer.
                        </p>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setAccountToDelete(null)}
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

export default StreamingManager;