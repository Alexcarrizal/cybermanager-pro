import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { StreamingPlatform, StreamingDistributor } from '../types';
import { X, Settings, Plus, Edit, Trash2, Layers, Server } from 'lucide-react';

interface Props {
    onClose: () => void;
}

const StreamingPlatformModal: React.FC<Props> = ({ onClose }) => {
    const { 
        streamingPlatforms, streamingDistributors, 
        addStreamingPlatform, deleteStreamingPlatform, 
        addStreamingDistributor, deleteStreamingDistributor 
    } = useCyber();

    const [activeTab, setActiveTab] = useState<'PLATFORMS' | 'DISTRIBUTORS'>('PLATFORMS');

    // New Item States
    const [isAdding, setIsAdding] = useState(false);
    
    // Platform Form
    const [pName, setPName] = useState('');
    const [pCategory, setPCategory] = useState('');
    const [pPrice, setPPrice] = useState('');
    const [pCost, setPCost] = useState('');

    // Distributor Form
    const [dName, setDName] = useState('');

    const handleSavePlatform = () => {
        if (!pName || !pPrice) return;
        addStreamingPlatform({
            id: Date.now().toString(),
            name: pName,
            category: pCategory || 'General',
            suggestedPrice: Number(pPrice),
            cost: Number(pCost)
        });
        resetForms();
    };

    const handleSaveDistributor = () => {
        if (!dName) return;
        addStreamingDistributor({
            id: Date.now().toString(),
            name: dName
        });
        resetForms();
    };

    const resetForms = () => {
        setPName(''); setPCategory(''); setPPrice(''); setPCost('');
        setDName('');
        setIsAdding(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Purple Header */}
                <div className="bg-purple-600 p-6 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Gestión de Plataformas y Distribuidores</h2>
                            <p className="text-purple-200 text-sm">Configura las plataformas de streaming y sus distribuidores</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700 bg-slate-800">
                    <button 
                        onClick={() => setActiveTab('PLATFORMS')}
                        className={`px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'PLATFORMS' 
                            ? 'border-purple-500 text-purple-400 bg-purple-500/5' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Layers className="w-4 h-4" /> Plataformas ({streamingPlatforms.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('DISTRIBUTORS')}
                        className={`px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'DISTRIBUTORS' 
                            ? 'border-purple-500 text-purple-400 bg-purple-500/5' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Server className="w-4 h-4" /> Distribuidores ({streamingDistributors.length})
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                    
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">
                            {activeTab === 'PLATFORMS' ? 'Plataformas de Streaming' : 'Distribuidores'}
                        </h3>
                        {!isAdding && (
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-900/20"
                            >
                                <Plus className="w-4 h-4" /> 
                                {activeTab === 'PLATFORMS' ? 'Agregar Plataforma' : 'Agregar Distribuidor'}
                            </button>
                        )}
                    </div>

                    {/* Add Form */}
                    {isAdding && (
                        <div className="bg-slate-800 p-5 rounded-xl border border-purple-500/30 mb-6 animate-in fade-in slide-in-from-top-2">
                            {activeTab === 'PLATFORMS' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input 
                                        placeholder="Nombre (ej. Netflix)" 
                                        value={pName} onChange={e => setPName(e.target.value)}
                                        className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                                    />
                                    <input 
                                        placeholder="Categoría (ej. Premium)" 
                                        value={pCategory} onChange={e => setPCategory(e.target.value)}
                                        className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                                    />
                                    <input 
                                        type="number" placeholder="Precio Sugerido" 
                                        value={pPrice} onChange={e => setPPrice(e.target.value)}
                                        className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                                    />
                                    <input 
                                        type="number" placeholder="Costo" 
                                        value={pCost} onChange={e => setPCost(e.target.value)}
                                        className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <input 
                                        placeholder="Nombre del Distribuidor" 
                                        value={dName} onChange={e => setDName(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={resetForms} className="text-slate-400 hover:text-white px-4 py-2">Cancelar</button>
                                <button 
                                    onClick={activeTab === 'PLATFORMS' ? handleSavePlatform : handleSaveDistributor}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Grid List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeTab === 'PLATFORMS' ? (
                            streamingPlatforms.map(platform => (
                                <div key={platform.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
                                            {platform.name.substring(0,1)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm line-clamp-1">{platform.name}</h4>
                                            <p className="text-xs text-slate-400">{platform.category}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-emerald-900/20 p-2 rounded-lg text-center border border-emerald-500/20">
                                            <p className="text-[10px] text-emerald-400 font-bold uppercase">Precio Sugerido</p>
                                            <p className="text-lg font-bold text-emerald-400">${platform.suggestedPrice}</p>
                                        </div>
                                        <div className="bg-blue-900/20 p-2 rounded-lg text-center border border-blue-500/20">
                                            <p className="text-[10px] text-blue-400 font-bold uppercase">Costo</p>
                                            <p className="text-lg font-bold text-blue-400">${platform.cost}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-700 pt-3 mt-3">
                                        <div className="flex gap-1">
                                            <span>Ganancia:</span>
                                            <span className="text-emerald-400">+${(platform.suggestedPrice - platform.cost).toFixed(2)}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <span>Margen:</span>
                                            <span className="text-emerald-400">{platform.suggestedPrice > 0 ? (((platform.suggestedPrice - platform.cost)/platform.suggestedPrice)*100).toFixed(1) : 0}%</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <button className="py-2 bg-slate-700/50 text-blue-400 rounded-lg text-xs font-bold hover:bg-slate-700 flex items-center justify-center gap-1">
                                            <Edit className="w-3 h-3" /> Editar
                                        </button>
                                        <button 
                                            onClick={() => deleteStreamingPlatform(platform.id)}
                                            className="py-2 bg-rose-900/10 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-bold hover:bg-rose-900/20 flex items-center justify-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            streamingDistributors.map(dist => (
                                <div key={dist.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-slate-700 rounded-lg text-slate-300">
                                            <Server className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{dist.name}</h4>
                                            <p className="text-xs text-slate-500">0 plataformas asociadas</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="py-2.5 bg-slate-700/50 text-blue-400 rounded-lg text-sm font-bold hover:bg-slate-700 flex items-center justify-center gap-2">
                                            <Edit className="w-4 h-4" /> Editar
                                        </button>
                                        <button 
                                            onClick={() => deleteStreamingDistributor(dist.id)}
                                            className="py-2.5 bg-rose-900/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm font-bold hover:bg-rose-900/20 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-5 bg-slate-800 border-t border-slate-700 flex justify-end">
                    <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StreamingPlatformModal;