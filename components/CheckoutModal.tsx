import React, { useState, useEffect, useRef } from 'react';
import { useCyber } from '../context/CyberContext';
import { Customer, PaymentMethod, SaleItem } from '../types';
import { X, Banknote, CreditCard, ArrowRightLeft, Plus, User, ShoppingCart, Calculator, Check, Smartphone } from 'lucide-react';

interface CheckoutModalProps {
    totalAmount: number;
    defaultCustomerId?: string;
    onConfirm: (method: PaymentMethod, customerId: string, extraItems?: SaleItem[]) => void;
    onCancel: () => void;
    title?: string;
}

// CLIP Commission Table (Base Rate + IVA 16%)
const CLIP_RATES = {
    CONTADO: 3.6,
    MSI_3: 5.4,
    MSI_6: 8.4,
    MSI_9: 11.4,
    MSI_12: 14.4
};

type ClipTerm = 'CONTADO' | 'MSI_3' | 'MSI_6' | 'MSI_9' | 'MSI_12';

const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
    totalAmount, 
    defaultCustomerId = 'public', 
    onConfirm, 
    onCancel,
    title = 'Confirmar Venta'
}) => {
    const { customers, addCustomer } = useCyber();
    const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCustomerId);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [addIva, setAddIva] = useState(false);
    
    // Cash specific
    const [amountReceived, setAmountReceived] = useState(totalAmount.toString());
    const cashInputRef = useRef<HTMLInputElement>(null);

    // CLIP specific
    const [clipTerm, setClipTerm] = useState<ClipTerm>('CONTADO');
    const [commissionPayer, setCommissionPayer] = useState<'CLIENT' | 'SELLER'>('CLIENT');

    // --- Calculations ---

    // 1. Calculate Base Total with optional IVA
    const subtotal = totalAmount;
    const ivaAmount = addIva ? subtotal * 0.16 : 0;
    const totalWithIva = subtotal + ivaAmount;

    // 2. Calculate CLIP Commission
    // Commission is calculated on the total amount being processed (including IVA if applicable)
    // Rate includes IVA of the commission itself? Usually terminals charge rate + IVA.
    // The prompt says "3.6% + IVA". So Rate * 1.16.
    const getClipRate = (term: ClipTerm) => CLIP_RATES[term] * 1.16;
    const commissionRate = getClipRate(clipTerm);
    const clipCommissionAmount = totalWithIva * (commissionRate / 100);

    // 3. Final Total to Charge
    let finalTotal = totalWithIva;
    if (paymentMethod === 'CLIP' && commissionPayer === 'CLIENT') {
        finalTotal += clipCommissionAmount;
    }

    // 4. Change Calculation
    const change = Math.max(0, (Number(amountReceived) || 0) - finalTotal);


    useEffect(() => {
        if (defaultCustomerId) {
            setSelectedCustomerId(defaultCustomerId);
        }
    }, [defaultCustomerId]);

    // Reset amount received when total changes (e.g. toggling IVA)
    useEffect(() => {
        setAmountReceived(finalTotal.toFixed(2));
    }, [finalTotal]);

    // Focus input on cash selection
    useEffect(() => {
        if (paymentMethod === 'CASH') {
            setTimeout(() => {
                if (cashInputRef.current) {
                    cashInputRef.current.focus();
                    cashInputRef.current.select();
                }
            }, 50);
        }
    }, [paymentMethod]);

    const handleRegisterClient = () => {
        const name = prompt("Nombre del cliente:");
        if (name) {
            const newCustomer: Customer = {
                id: Date.now().toString(),
                name,
                points: 0
            };
            addCustomer(newCustomer);
            setSelectedCustomerId(newCustomer.id);
        }
    };

    const handleConfirm = () => {
        const received = parseFloat(amountReceived) || 0;
        
        if (paymentMethod === 'CASH' && received < finalTotal) {
            alert(`El monto recibido ($${received}) es menor al total ($${finalTotal.toFixed(2)}).`);
            return;
        }

        // Construct Extra Items (IVA, Commission)
        const extraItems: SaleItem[] = [];
        
        if (addIva) {
            extraItems.push({
                productId: 'TAX_IVA',
                productName: 'IVA (16%)',
                quantity: 1,
                priceAtSale: ivaAmount,
                costAtSale: 0
            });
        }

        if (paymentMethod === 'CLIP' && commissionPayer === 'CLIENT') {
            extraItems.push({
                productId: 'COMMISSION_CLIP',
                productName: `Comisión CLIP (${CLIP_RATES[clipTerm]}% + IVA)`,
                quantity: 1,
                priceAtSale: clipCommissionAmount,
                costAtSale: 0
            });
        } 
        // Note: If Seller pays commission, we typically record it as an Expense or just reduced profit.
        // For simple POS logic, we accept the payment of 'totalWithIva' but maybe log an expense in background.
        // For now, we won't add an item if seller pays, but the 'Sale' total will be `totalWithIva`.

        onConfirm(paymentMethod, selectedCustomerId, extraItems);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-t-xl rounded-b-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                
                {/* Header Purple */}
                <div className="bg-purple-600 p-4 flex items-center gap-2">
                    <ShoppingCart className="text-white w-6 h-6" />
                    <h2 className="text-xl font-bold text-white">Carrito</h2>
                </div>

                <div className="p-6 bg-slate-50 space-y-6 max-h-[80vh] overflow-y-auto">
                    
                    {/* Top Summary Item (Mock visual based on screenshot) */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                             {/* Simple Counter mockup */}
                            <div className="flex items-center bg-gray-100 rounded-lg">
                                <button className="p-1 px-3 text-gray-500 hover:text-gray-700">-</button>
                                <span className="font-bold text-gray-700">1</span>
                                <button className="p-1 px-3 text-purple-600 hover:text-purple-700 font-bold">+</button>
                            </div>
                            <span className="text-gray-600 font-medium">Items en carrito</span>
                        </div>
                        <span className="text-purple-600 font-bold text-lg">${subtotal.toFixed(2)}</span>
                    </div>

                    {/* Customer & IVA */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-gray-600 font-medium">Cliente</label>
                        </div>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                             <button className="flex-1 py-2 text-sm font-medium bg-purple-600 text-white rounded-md shadow-sm flex items-center justify-center gap-1">
                                <User className="w-4 h-4" /> 
                                {selectedCustomerId === 'public' ? 'Público' : customers.find(c=>c.id===selectedCustomerId)?.name}
                             </button>
                             <button onClick={handleRegisterClient} className="flex-1 py-2 text-sm font-medium text-gray-500 hover:bg-white hover:shadow-sm rounded-md transition-all">
                                Nuevo / Cambiar
                             </button>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer mt-2">
                            <input 
                                type="checkbox" 
                                checked={addIva}
                                onChange={e => setAddIva(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-gray-600">Agregar IVA 16% (Requiere factura)</span>
                        </label>
                    </div>

                    {/* Payment Methods */}
                    <div>
                        <label className="block text-gray-600 font-medium mb-2">Método de Pago</label>
                        <div className="space-y-2">
                            <button 
                                onClick={() => setPaymentMethod('CASH')}
                                className={`w-full p-3 rounded-lg flex justify-between items-center transition-all ${
                                    paymentMethod === 'CASH' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Banknote className="w-5 h-5" />
                                    <span className="font-bold">Efectivo</span>
                                </div>
                                <span className="text-xs opacity-80">(Sin comisión)</span>
                            </button>

                            <button 
                                onClick={() => setPaymentMethod('TRANSFER')}
                                className={`w-full p-3 rounded-lg flex justify-between items-center transition-all ${
                                    paymentMethod === 'TRANSFER' ? 'bg-gray-700 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <ArrowRightLeft className="w-5 h-5" />
                                    <span className="font-bold">Transferencia</span>
                                </div>
                                <span className="text-xs opacity-80">(Sin comisión)</span>
                            </button>

                            <button 
                                onClick={() => setPaymentMethod('CLIP')}
                                className={`w-full p-3 rounded-lg flex justify-between items-center transition-all ${
                                    paymentMethod === 'CLIP' ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Smartphone className="w-5 h-5" />
                                    <span className="font-bold">Terminal CLIP</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* --- CASH LOGIC --- */}
                    {paymentMethod === 'CASH' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                             <div className="flex items-center gap-2 text-gray-700 font-bold">
                                 <Calculator className="w-4 h-4" /> Calcular Cambio
                             </div>
                             <input 
                                ref={cashInputRef}
                                type="number"
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="w-full border border-gray-300 rounded-lg p-3 text-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                placeholder="Monto recibido"
                             />
                             <div className="text-right text-sm text-gray-500">
                                 Cambio: <span className="font-bold text-emerald-600">${change.toFixed(2)}</span>
                             </div>
                        </div>
                    )}

                    {/* --- CLIP LOGIC --- */}
                    {paymentMethod === 'CLIP' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                             
                             {/* Plazo de Pago */}
                             <div>
                                 <h4 className="text-orange-800 font-bold mb-2">Plazo de Pago</h4>
                                 <div className="grid grid-cols-3 gap-2">
                                     <button 
                                        onClick={() => setClipTerm('CONTADO')}
                                        className={`p-2 rounded border text-xs font-bold transition-all flex flex-col items-center ${
                                            clipTerm === 'CONTADO' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-200'
                                        }`}
                                     >
                                         <span>Contado</span>
                                         <span className="opacity-80 text-[10px]">3.6% + IVA</span>
                                     </button>
                                     <button 
                                        onClick={() => setClipTerm('MSI_3')}
                                        className={`p-2 rounded border text-xs font-bold transition-all flex flex-col items-center ${
                                            clipTerm === 'MSI_3' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-200'
                                        }`}
                                     >
                                         <span>3 MSI</span>
                                         <span className="opacity-80 text-[10px]">5.4% + IVA</span>
                                     </button>
                                     <button 
                                        onClick={() => setClipTerm('MSI_6')}
                                        className={`p-2 rounded border text-xs font-bold transition-all flex flex-col items-center ${
                                            clipTerm === 'MSI_6' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-200'
                                        }`}
                                     >
                                         <span>6 MSI</span>
                                         <span className="opacity-80 text-[10px]">8.4% + IVA</span>
                                     </button>
                                     <button 
                                        onClick={() => setClipTerm('MSI_9')}
                                        className={`p-2 rounded border text-xs font-bold transition-all flex flex-col items-center ${
                                            clipTerm === 'MSI_9' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-200'
                                        }`}
                                     >
                                         <span>9 MSI</span>
                                         <span className="opacity-80 text-[10px]">11.4% + IVA</span>
                                     </button>
                                     <button 
                                        onClick={() => setClipTerm('MSI_12')}
                                        className={`p-2 rounded border text-xs font-bold transition-all flex flex-col items-center ${
                                            clipTerm === 'MSI_12' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-200'
                                        }`}
                                     >
                                         <span>12 MSI</span>
                                         <span className="opacity-80 text-[10px]">14.4% + IVA</span>
                                     </button>
                                 </div>
                             </div>

                             {/* Commission Payer */}
                             <div>
                                 <h4 className="text-orange-800 font-bold mb-2">¿Quién paga la comisión?</h4>
                                 <div className="flex rounded-lg overflow-hidden border border-orange-200">
                                     <button 
                                        onClick={() => setCommissionPayer('CLIENT')}
                                        className={`flex-1 py-2 text-sm font-bold transition-colors ${
                                            commissionPayer === 'CLIENT' ? 'bg-orange-600 text-white' : 'bg-white text-gray-500'
                                        }`}
                                     >
                                         Cliente
                                     </button>
                                     <button 
                                        onClick={() => setCommissionPayer('SELLER')}
                                        className={`flex-1 py-2 text-sm font-bold transition-colors ${
                                            commissionPayer === 'SELLER' ? 'bg-orange-600 text-white' : 'bg-white text-gray-500'
                                        }`}
                                     >
                                         Vendedor
                                     </button>
                                 </div>
                             </div>

                             {/* Commission Info */}
                             <div className="bg-orange-100 p-3 rounded-lg border border-orange-200">
                                 <p className="text-orange-800 text-sm font-bold mb-1">
                                     Comisión CLIP ({CLIP_RATES[clipTerm]}% + IVA):
                                 </p>
                                 <p className="text-2xl font-bold text-orange-700">
                                     ${clipCommissionAmount.toFixed(3)}
                                 </p>
                                 <p className="text-xs text-orange-600 mt-1">
                                     {commissionPayer === 'CLIENT' 
                                        ? 'El cliente pagará la comisión adicional.' 
                                        : 'El vendedor absorbe la comisión (se descuenta de la venta).'}
                                 </p>
                             </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="space-y-1 pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-gray-700 font-medium">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        {addIva && (
                             <div className="flex justify-between text-gray-500 text-sm">
                                <span>IVA (16%)</span>
                                <span>+${ivaAmount.toFixed(2)}</span>
                            </div>
                        )}
                        {paymentMethod === 'CLIP' && commissionPayer === 'CLIENT' && (
                            <div className="flex justify-between text-orange-600 text-sm font-medium">
                                <span>Comisión CLIP</span>
                                <span>+${clipCommissionAmount.toFixed(3)}</span>
                            </div>
                        )}
                         {paymentMethod === 'CLIP' && commissionPayer === 'SELLER' && (
                            <div className="flex justify-between text-slate-400 text-sm">
                                <span>Comisión (absorbe vendedor)</span>
                                <span>-${clipCommissionAmount.toFixed(3)}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center text-2xl font-bold text-purple-600 pt-2">
                            <span>Total a Cobrar</span>
                            <span>${finalTotal.toFixed(paymentMethod === 'CLIP' ? 3 : 2)}</span>
                        </div>
                    </div>

                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
                     <button 
                        onClick={onCancel}
                        className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-lg font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
                     >
                        <X className="w-5 h-5" /> Cancelar
                     </button>
                     <button 
                        onClick={handleConfirm}
                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2"
                     >
                        <Check className="w-5 h-5" /> Confirmar
                     </button>
                </div>

            </div>
        </div>
    );
};

export default CheckoutModal;