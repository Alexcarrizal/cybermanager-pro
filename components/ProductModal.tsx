import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useCyber } from '../context/CyberContext';
import { X } from 'lucide-react';

interface ProductModalProps {
  product?: Product; // If provided, edit mode
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addProduct, products } = useCyber();
  
  // Get unique existing values for autocomplete suggestions
  const existingCategories = Array.from(new Set(products.map(p => p.category)));
  const existingDistributors = Array.from(new Set(products.map(p => p.distributor).filter(Boolean) as string[])).sort();

  // Default hardcoded categories to ensure they always appear as suggestions
  const defaultCategories = ['Accesorios', 'Bebidas', 'Botanas', 'Papelería', 'Servicios'];
  
  // Combine and Sort Alphabetically
  const allCategorySuggestions = Array.from(new Set([...defaultCategories, ...existingCategories])).sort((a, b) => a.localeCompare(b));

  const warrantyOptions = ["1 Mes", "3 Meses", "6 Meses", "1 Año"];

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    distributor: '',
    barcode: '',
    hasWarranty: false,
    warrantyPeriod: '',
    cost: 0,
    price: 0,
    trackStock: true,
    stock: 0
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) return;

    const newProduct: Product = {
      id: product?.id || Date.now().toString(),
      name: formData.name!,
      category: formData.category, // Now accepts any string
      distributor: formData.distributor || '',
      barcode: formData.barcode || '',
      hasWarranty: formData.hasWarranty || false,
      warrantyPeriod: formData.warrantyPeriod || '',
      cost: Number(formData.cost) || 0,
      price: Number(formData.price) || 0,
      trackStock: formData.trackStock || false,
      stock: Number(formData.stock) || 0
    };

    addProduct(newProduct);
    onClose();
  };

  // Calculations
  const profit = (Number(formData.price) || 0) - (Number(formData.cost) || 0);
  // Avoid division by zero
  const margin = Number(formData.price) > 0 ? (profit / Number(formData.price)) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-4xl rounded-xl border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">
            {product ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Basic Info */}
            <div className="space-y-5">
              <h3 className="text-slate-200 font-semibold border-b border-slate-700 pb-2 mb-4">Información Básica</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre del Producto *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                  placeholder="Ej. Papas Sabritas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Categoría *</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    list="category-options"
                    value={formData.category}
                    onChange={e => handleChange('category', e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none placeholder-slate-500"
                    placeholder="Escribe o selecciona..."
                  />
                  <datalist id="category-options">
                    {allCategorySuggestions.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <p className="text-xs text-slate-500 mt-1">Escribe una nueva para crearla.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Distribuidor</label>
                <input 
                  type="text" 
                  list="distributor-options"
                  value={formData.distributor}
                  onChange={e => handleChange('distributor', e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                  placeholder="Ej. Sabritas S.A de C.V"
                />
                 <datalist id="distributor-options">
                    {existingDistributors.map(dist => (
                      <option key={dist} value={dist} />
                    ))}
                  </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Código de Barras</label>
                <input 
                  type="text" 
                  value={formData.barcode}
                  onChange={e => handleChange('barcode', e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                  placeholder="Escanea o ingresa el código"
                />
              </div>

              <div className="pt-2">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.hasWarranty}
                      onChange={e => handleChange('hasWarranty', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300 text-sm">Este producto tiene garantía</span>
                 </label>
                 {formData.hasWarranty && (
                    <>
                        <input 
                        list="warranty-options"
                        type="text" 
                        value={formData.warrantyPeriod}
                        onChange={e => handleChange('warrantyPeriod', e.target.value)}
                        className="mt-2 w-full bg-slate-700/50 border border-slate-600 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                        placeholder="Seleccione o escriba periodo"
                        />
                        <datalist id="warranty-options">
                            {warrantyOptions.map(opt => (
                                <option key={opt} value={opt} />
                            ))}
                        </datalist>
                    </>
                 )}
              </div>
            </div>

            {/* Right Column: Price & Inventory */}
            <div className="space-y-5">
              <h3 className="text-slate-200 font-semibold border-b border-slate-700 pb-2 mb-4">Precios e Inventario</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Costo de Compra</label>
                <input 
                  type="number" 
                  value={formData.cost}
                  onChange={e => handleChange('cost', e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Precio de Venta *</label>
                <input 
                  type="number" 
                  required
                  value={formData.price}
                  onChange={e => handleChange('price', e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="pt-4">
                 <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input 
                      type="checkbox"
                      checked={formData.trackStock}
                      onChange={e => handleChange('trackStock', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300 text-sm font-bold">Este producto maneja inventario</span>
                 </label>
                 
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Stock Inicial *</label>
                    <input 
                        type="number" 
                        disabled={!formData.trackStock}
                        value={formData.stock}
                        onChange={e => handleChange('stock', e.target.value)}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none disabled:opacity-50"
                    />
                 </div>
              </div>

              {/* Profitability Card */}
              <div className="mt-6 bg-amber-900/20 border border-amber-500/20 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm mb-1">Rentabilidad Estimada</p>
                  <div className="text-2xl font-bold text-amber-500">
                      ${profit.toFixed(2)} <span className="text-sm font-normal text-amber-400/70">({margin.toFixed(1)}%)</span>
                  </div>
              </div>

            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-900/20"
            >
                {product ? 'Actualizar Producto' : 'Guardar Producto'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;