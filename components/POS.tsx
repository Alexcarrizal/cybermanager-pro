import React, { useState, useMemo } from 'react';
import { useCyber } from '../context/CyberContext';
import { Product, SaleItem, PaymentMethod, Sale } from '../types';
import { Search, Plus, Minus, ShoppingCart, Trash2, Coffee, Printer, Gamepad, Box, CheckCircle, ArrowRight, Flame, Trophy } from 'lucide-react';
import CheckoutModal from './CheckoutModal';

const POS: React.FC = () => {
  const { products, sales, recordSale, businessSettings, customers } = useCyber();
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [successSale, setSuccessSale] = useState<Sale | null>(null);

  // --- Top 10 Calculation ---
  const topSellingProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        // Exclude system IDs like RENTAL or MANUAL_ENTRY to show only inventory products
        if (item.productId && item.productId !== 'RENTAL' && item.productId !== 'MANUAL_ENTRY' && !item.productId.startsWith('COMMISSION_')) {
           counts[item.productId] = (counts[item.productId] || 0) + item.quantity;
        }
      });
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a) // Sort descending by quantity
      .slice(0, 10) // Take top 10
      .map(([id, count]) => {
          const product = products.find(p => p.id === id);
          return product ? { product, count } : null;
      })
      .filter((item): item is { product: Product, count: number } => !!item); // Filter out deleted products
  }, [sales, products]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, priceAtSale: product.price }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.priceAtSale * item.quantity), 0);

  const handleConfirmSale = (method: PaymentMethod, customerId: string, extraItems?: SaleItem[]) => {
    // Combine cart items with extra items (IVA, Commission) if any
    const finalItems = extraItems ? [...cart, ...extraItems] : cart;
    const newSale = recordSale(finalItems, 'POS', method, customerId);
    setSuccessSale(newSale); 
    setCart([]);
    setShowCheckout(false);
  };

  const getIcon = (cat: string) => {
      const c = cat.toUpperCase();
      if (c === 'SNACK' || c === 'DRINK' || c === 'BOTANAS' || c === 'BEBIDAS') return <Coffee className="w-5 h-5" />;
      if (c === 'SERVICE' || c === 'SERVICIOS') return <Printer className="w-5 h-5" />;
      if (c === 'ACCESORIOS' || c === 'ACCESSORY') return <Gamepad className="w-5 h-5" />;
      return <Box className="w-5 h-5" />; // Generic icon for custom categories
  }

  const handlePrintRemision = (sale: Sale) => {
      const customerName = customers.find(c => c.id === sale.customerId)?.name || 'Público General';
      const dateStr = new Date(sale.timestamp).toLocaleString();
      
      const itemsHtml = sale.items.map(item => {
          // Find original product to check for warranty info
          const originalProduct = products.find(p => p.id === item.productId);
          const hasWarranty = originalProduct?.hasWarranty;
          const warrantyText = hasWarranty ? `<br><span style="font-size: 9px; font-style: italic;">Garantía: ${originalProduct.warrantyPeriod}</span>` : '';
          const serialLine = hasWarranty ? `<br><span style="font-size: 9px;">S/N: ________________________</span>` : '';
          
          return `
            <tr>
                <td>
                    ${item.quantity}x ${item.productName}
                    ${warrantyText}
                    ${serialLine}
                </td>
                <td style="text-align: right;">$${(item.priceAtSale * item.quantity).toFixed(2)}</td>
            </tr>
          `;
      }).join('');

      const html = `
        <div class="receipt-half">
            <div class="header">
                <div class="biz-info">
                    <h1>${businessSettings.name}</h1>
                    <p>${businessSettings.address}</p>
                    <p>${businessSettings.whatsapp}</p>
                </div>
                <div class="order-id">
                    <h2>NOTA DE REMISIÓN</h2>
                    <div class="folio">#${sale.id.slice(-6)}</div>
                </div>
            </div>

            <div class="info-grid">
                <div>
                    <strong>Fecha:</strong> ${dateStr}<br>
                    <strong>Cliente:</strong> ${customerName}
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th style="text-align: left;">Descripción</th>
                        <th style="text-align: right;">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="financials">
                <div class="f-item highlight">Total: $${sale.total.toFixed(2)}</div>
            </div>
            
            <div class="footer">
                <p>Método de Pago: ${sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'CARD' ? 'Tarjeta' : sale.paymentMethod === 'CLIP' ? 'Terminal CLIP' : 'Transferencia'}</p>
                <p class="terms-text">
                    ${businessSettings.footerMessage || 'Gracias por su compra.'} <br>
                    Para garantías es indispensable presentar esta nota y el producto en buen estado.
                </p>
            </div>
        </div>
      `;

      const styles = `
        <style>
            @media print {
                @page { margin: 0.5cm; size: letter; }
                body { font-family: 'Arial', sans-serif; font-size: 11px; color: #000; -webkit-print-color-adjust: exact; }
                .page-container { display: flex; flex-direction: column; height: 98vh; justify-content: space-between; }
                .receipt-half { border: 1px solid #000; padding: 20px; height: 48%; display: flex; flex-direction: column; }
                .cut-line { border-top: 1px dashed #666; width: 100%; margin: 10px 0; position: relative; }
                .cut-line::after { content: '✂ Cortar aquí'; position: absolute; right: 0; top: -10px; font-size: 10px; background: #fff; }
                
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
                .biz-info h1 { margin: 0; font-size: 16px; text-transform: uppercase; }
                .biz-info p { margin: 1px 0; font-size: 10px; }
                .order-id { text-align: right; }
                .order-id h2 { margin: 0; font-size: 12px; }
                .folio { font-size: 16px; font-weight: bold; }

                .info-grid { margin-bottom: 15px; font-size: 11px; }
                
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
                .items-table th { border-bottom: 1px solid #000; padding: 5px 0; }
                .items-table td { border-bottom: 1px solid #eee; padding: 5px 0; vertical-align: top; }

                .financials { display: flex; justify-content: flex-end; margin-top: auto; margin-bottom: 20px; font-size: 14px; }
                .highlight { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; }

                .footer { text-align: center; font-size: 9px; color: #444; }
                .terms-text { margin-top: 5px; font-style: italic; }
            }
        </style>
      `;

      const win = window.open('', '', 'width=800,height=600');
      if (win) {
          win.document.write(`
            <html>
                <head><title>Imprimir Remisión</title>${styles}</head>
                <body>
                    <div class="page-container">
                        ${html}
                        <div class="cut-line"></div>
                        ${html}
                    </div>
                    <script>
                        setTimeout(() => { window.print(); window.close(); }, 500);
                    </script>
                </body>
            </html>
          `);
          win.document.close();
      }
  };

  return (
    <>
    <div className="flex h-full">
      {/* Product List */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Punto de Venta</h2>
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Top 10 Section - Visible when not searching and there is data */}
        {topSellingProducts.length > 0 && !search && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" /> 
                    Top 10 Más Vendidos
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-4 pt-3 pl-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {topSellingProducts.map(({ product, count }, index) => (
                        <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            disabled={product.trackStock && product.stock <= 0}
                            className="min-w-[170px] max-w-[170px] bg-slate-800 border border-slate-700 p-3 rounded-xl relative hover:border-orange-500/50 hover:bg-slate-700/50 transition-all group flex flex-col items-start text-left shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {/* Rank Badge - Enhanced Visuals */}
                            <div className={`absolute -top-3 -right-2 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white shadow-xl z-20 border-2 border-slate-900 transition-transform duration-300 ${
                                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-yellow-500/40 scale-110 group-hover:scale-125' :
                                index === 1 ? 'bg-slate-400 shadow-slate-400/40' :
                                index === 2 ? 'bg-amber-700 shadow-amber-700/40' :
                                'bg-slate-600'
                            }`}>
                                #{index + 1}
                            </div>
                            
                            <div className="p-2 bg-slate-700/50 rounded-lg text-slate-300 group-hover:text-white transition-colors mb-2">
                                {index === 0 ? <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500" /> : getIcon(product.category)}
                            </div>
                            
                            <h4 className="font-bold text-slate-200 text-sm line-clamp-2 w-full mb-1 h-10">{product.name}</h4>
                            
                            <div className="mt-auto w-full">
                                <div className='flex justify-between items-center mb-1'>
                                    <span className="font-bold text-emerald-400 text-sm">${product.price}</span>
                                    <span className="text-[10px] font-bold bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">
                                        {count} vendidos
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500">
                                    {!product.trackStock ? 'Infinito' : `${product.stock} disponibles`}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Box className="w-5 h-5 text-blue-500" /> 
            Catálogo Completo
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.trackStock && product.stock <= 0}
              className="group bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500 text-left transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-slate-700 rounded-lg text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {getIcon(product.category)}
                </div>
                <span className="font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded text-sm">${product.price}</span>
              </div>
              <h3 className="font-medium text-slate-200 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-slate-500 mt-1">Stock: {!product.trackStock ? '∞' : product.stock}</p>
            </button>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
            <div className="text-center py-10 text-slate-500">
                <p>No se encontraron productos.</p>
            </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col h-full shadow-2xl z-10">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Ticket de Venta
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center group">
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{item.productName}</p>
                  <p className="text-slate-400 text-xs">${item.priceAtSale} c/u</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-900 rounded-md">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:text-white text-slate-400"><Minus className="w-3 h-3" /></button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:text-white text-slate-400"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="text-slate-500 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400">Total</span>
            <span className="text-3xl font-bold text-white">${total.toFixed(2)}</span>
          </div>
          <button 
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20"
          >
            Cobrar
          </button>
        </div>
      </div>
    </div>
    
    {showCheckout && (
        <CheckoutModal 
            totalAmount={total}
            onCancel={() => setShowCheckout(false)}
            onConfirm={handleConfirmSale}
        />
    )}

    {/* Success / Print Modal */}
    {successSale && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-emerald-500/50 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">¡Venta Exitosa!</h2>
                    <p className="text-slate-400 mt-2">Total cobrado: ${successSale.total.toFixed(2)}</p>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => handlePrintRemision(successSale)}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-slate-600"
                    >
                        <Printer className="w-5 h-5" /> Imprimir Nota de Remisión
                    </button>
                    <button 
                        onClick={() => setSuccessSale(null)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        <ArrowRight className="w-5 h-5" /> Nueva Venta
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default POS;