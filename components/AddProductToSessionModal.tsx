import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { Product, Station } from '../types';
import { X, Search, Plus } from 'lucide-react';

interface Props {
    station: Station;
    onClose: () => void;
}

const AddProductToSessionModal: React.FC<Props> = ({ station, onClose }) => {
    const { products, addOrderToSession } = useCyber();
    const [searchTerm, setSearchTerm] = useState('');
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState('');

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddProduct = (product: Product) => {
        if (product.trackStock && product.stock <= 0) {
            alert('Producto sin stock');
            return;
        }
        addOrderToSession(station.id, {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
        onClose();
    };

    const handleAddCustom = () => {
        if (!customName || !customPrice) return;
        addOrderToSession(station.id, {
            name: customName,
            price: Number(customPrice),
            quantity: 1
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-lg font-bold text-white">Agregar Producto a la Cuenta</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto">
                    {/* Search */}
                    <div>
                         <div className="relative">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Buscar producto del catálogo..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Custom Product */}
                    <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-700">
                        <p className="text-sm font-bold text-white mb-3">... o agregar un producto personalizado</p>
                        <div className="flex gap-3 mb-3">
                            <input 
                                type="text"
                                placeholder="Nombre del producto"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                            />
                            <input 
                                type="number"
                                placeholder="Precio"
                                value={customPrice}
                                onChange={(e) => setCustomPrice(e.target.value)}
                                className="w-24 bg-slate-700 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <button 
                            onClick={handleAddCustom}
                            className="w-full py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
                        >
                            Agregar Personalizado
                        </button>
                    </div>

                    {/* Product List */}
                    <div className="space-y-2">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => handleAddProduct(product)}
                                className="w-full flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all group"
                            >
                                <div className="text-left">
                                    <p className="font-bold text-white">{product.name}</p>
                                    <p className="text-xs text-slate-400">${product.price.toFixed(2)}</p>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-bold ${!product.trackStock || product.stock > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {!product.trackStock ? 'Inf.' : `${product.stock} disp.`}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddProductToSessionModal;