import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { Product } from '../types';
import { Package, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import ProductModal from './ProductModal';

// Helper for category display
const categoryLabel = (cat: string) => {
    // Map legacy/default keys to labels, else return raw string
    const map: Record<string, string> = {
        'SNACK': 'Botanas',
        'DRINK': 'Bebidas',
        'ACCESSORY': 'Accesorios',
        'SERVICE': 'Servicios'
    };
    return map[cat] || cat;
};

const categoryColor = (cat: string) => {
    const map: Record<string, string> = {
        'SNACK': 'bg-purple-500/20 text-purple-300',
        'Botanas': 'bg-purple-500/20 text-purple-300',
        'DRINK': 'bg-blue-500/20 text-blue-300',
        'Bebidas': 'bg-blue-500/20 text-blue-300',
        'ACCESSORY': 'bg-orange-500/20 text-orange-300',
        'Accesorios': 'bg-orange-500/20 text-orange-300',
        'SERVICE': 'bg-emerald-500/20 text-emerald-300',
        'Servicios': 'bg-emerald-500/20 text-emerald-300',
        'Papelería': 'bg-pink-500/20 text-pink-300',
    };
    // Default color for custom categories
    return map[cat] || 'bg-indigo-500/20 text-indigo-300';
}

const Inventory: React.FC = () => {
  const { products, deleteProduct } = useCyber();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(products.map(p => categoryLabel(p.category)))).sort();

  // Stats
  const totalProducts = products.length;
  const withInventory = products.filter(p => p.trackStock && p.stock > 0).length;
  const noInventory = products.filter(p => p.trackStock && p.stock === 0).length;
  const lowStock = products.filter(p => p.trackStock && p.stock > 0 && p.stock < 5).length;
  const categoriesCount = uniqueCategories.length;

  // Filter
  const filteredProducts = products.filter(p => {
     const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.barcode?.includes(searchTerm) ||
                           categoryLabel(p.category).toLowerCase().includes(searchTerm.toLowerCase());
     
     const matchesCategory = selectedCategory === 'Todas' || categoryLabel(p.category) === selectedCategory;

     return matchesSearch && matchesCategory;
  });

  const confirmDelete = () => {
      if (productToDelete) {
          deleteProduct(productToDelete);
          setProductToDelete(null);
      }
  };

  const handleEdit = (product: Product) => {
      setEditingProduct(product);
      setIsModalOpen(true);
  };

  const handleAdd = () => {
      setEditingProduct(undefined);
      setIsModalOpen(true);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-900">
       
       <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">Gestión de Productos</h2>
            <button 
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-blue-900/30 transition-all"
            >
                Agregar Producto
            </button>
       </div>

       {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-blue-500 shadow-lg">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Productos</p>
                <h3 className="text-3xl font-bold text-white">{totalProducts}</h3>
            </div>
            <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-emerald-500 shadow-lg">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Con Inventario</p>
                <h3 className="text-3xl font-bold text-white">{withInventory}</h3>
            </div>
            <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-amber-500 shadow-lg">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Sin Inventario</p>
                <h3 className="text-3xl font-bold text-white">{noInventory}</h3>
            </div>
            <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-orange-500 shadow-lg">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Stock Bajo</p>
                <h3 className="text-3xl font-bold text-white">{lowStock}</h3>
            </div>
             <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-indigo-500 shadow-lg">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Categorías</p>
                <h3 className="text-3xl font-bold text-white">{categoriesCount}</h3>
            </div>
       </div>

       {/* Search Bar */}
       <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                    type="text"
                    placeholder="Buscar por nombre, categoría, código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500"
                />
            </div>
            <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 text-slate-300 outline-none focus:border-blue-500"
            >
                <option value="Todas">Todas las categorías</option>
                {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
       </div>

       {/* Table */}
       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
           <table className="w-full text-left">
               <thead className="bg-slate-900/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                   <tr>
                       <th className="px-6 py-4">Producto</th>
                       <th className="px-6 py-4">Categoría / Distribuidor</th>
                       <th className="px-6 py-4">Precios</th>
                       <th className="px-6 py-4">Rentabilidad</th>
                       <th className="px-6 py-4">Stock</th>
                       <th className="px-6 py-4">Garantía</th>
                       <th className="px-6 py-4 text-right">Acciones</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-700">
                   {filteredProducts.map(p => {
                       const profit = p.price - p.cost;
                       const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
                       
                       return (
                        <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-white">{p.name}</div>
                                {p.barcode && <div className="text-xs text-slate-500 font-mono mt-0.5">{p.barcode}</div>}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col items-start gap-1">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${categoryColor(categoryLabel(p.category))}`}>
                                        {categoryLabel(p.category)}
                                    </span>
                                    {p.distributor && (
                                        <span className="text-xs text-slate-500">{p.distributor}</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-white font-bold text-sm">Venta: ${p.price.toFixed(2)}</div>
                                <div className="text-slate-500 text-xs">Costo: ${p.cost.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-emerald-400 font-bold text-sm">+${profit.toFixed(2)}</div>
                                <div className="text-slate-500 text-xs">{margin.toFixed(1)}% margen</div>
                            </td>
                            <td className="px-6 py-4">
                                {categoryLabel(p.category) === 'Servicios' || p.category === 'SERVICE' ? (
                                    <span className="text-slate-500 text-sm italic">Infinito</span>
                                ) : (
                                    <span className={`text-sm font-medium ${p.stock < 5 ? 'text-orange-400' : 'text-slate-300'}`}>
                                        {p.stock} unidades
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300">
                                {p.hasWarranty ? p.warrantyPeriod || 'Sí' : 'Sin garantía'}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setProductToDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                       )
                   })}
               </tbody>
           </table>
           {filteredProducts.length === 0 && (
               <div className="p-8 text-center text-slate-500">
                   No se encontraron productos que coincidan con tu búsqueda.
               </div>
           )}
       </div>

       {isModalOpen && (
           <ProductModal 
                product={editingProduct} 
                onClose={() => setIsModalOpen(false)} 
           />
       )}

       {/* Delete Confirmation Modal */}
       {productToDelete && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center gap-3 text-rose-500 mb-4">
                        <div className="p-3 bg-rose-500/10 rounded-full">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white">¿Eliminar Producto?</h3>
                    </div>
                    
                    <p className="text-slate-400 mb-6">
                        Esta acción eliminará el producto del inventario permanentemente. No se puede deshacer.
                    </p>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setProductToDelete(null)}
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

export default Inventory;