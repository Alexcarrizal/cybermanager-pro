import React, { useState, useEffect } from 'react';
import { useCyber } from '../context/CyberContext';
import { Customer, StreamingPlatform, StreamingAccount } from '../types';
import { X, PlayCircle, Plus, Calendar, Eye, Send, Save, EyeOff, Clock } from 'lucide-react';

interface Props {
    onClose: () => void;
    accountToEdit?: StreamingAccount; // Optional prop for edit mode
}

const StreamingSaleModal: React.FC<Props> = ({ onClose, accountToEdit }) => {
    const { customers, streamingPlatforms, addStreamingAccount, updateStreamingAccount, addCustomer } = useCyber();

    // Form State
    const [customerId, setCustomerId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    
    const [platformId, setPlatformId] = useState('');
    const [accountEmail, setAccountEmail] = useState('');
    const [accountPassword, setAccountPassword] = useState('');
    const [profileName, setProfileName] = useState('');
    const [pin, setPin] = useState('');
    
    // Expiration Logic
    const [expirationMode, setExpirationMode] = useState<'DURATION' | 'MANUAL'>('DURATION');
    const [duration, setDuration] = useState(30); // days
    const [manualDate, setManualDate] = useState(''); // YYYY-MM-DD
    
    const [price, setPrice] = useState(0);
    const [cost, setCost] = useState(0);
    
    const [isAdult, setIsAdult] = useState(false);
    const [isTrial, setIsTrial] = useState(false);
    
    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [sendWhatsApp, setSendWhatsApp] = useState(true);

    // Initialize if Edit Mode
    useEffect(() => {
        if (accountToEdit) {
            setCustomerId(accountToEdit.customerId || '');
            setCustomerName(accountToEdit.customerName);
            setCustomerPhone(accountToEdit.customerPhone || '');
            setPlatformId(accountToEdit.platformId);
            setAccountEmail(accountToEdit.accountEmail);
            setAccountPassword(accountToEdit.accountPassword || '');
            setProfileName(accountToEdit.profileName || '');
            setPin(accountToEdit.pin || '');
            
            setDuration(accountToEdit.durationDays);
            setExpirationMode('DURATION'); 
            
            const expDate = new Date(accountToEdit.expirationDate);
            setManualDate(expDate.toISOString().split('T')[0]);

            setPrice(accountToEdit.price);
            setCost(accountToEdit.cost);
            setIsAdult(accountToEdit.isAdult);
            setIsTrial(accountToEdit.isTrial);
        } else {
             // Set manual date default to 30 days from now
             const d = new Date();
             d.setDate(d.getDate() + 30);
             setManualDate(d.toISOString().split('T')[0]);
        }
    }, [accountToEdit]);

    // Pre-fill price when platform changes
    useEffect(() => {
        if (!accountToEdit) {
            const plat = streamingPlatforms.find(p => p.id === platformId);
            if (plat) {
                setPrice(plat.suggestedPrice);
                setCost(plat.cost);
            }
        }
    }, [platformId, streamingPlatforms, accountToEdit]);

    // Calculate expiration display
    const calculateExpDateDisplay = () => {
        if (expirationMode === 'MANUAL') {
             if (!manualDate) return 'Seleccione fecha';
             const parts = manualDate.split('-');
             // Note: Date input gives YYYY-MM-DD. Date constructor expects month 0-indexed.
             const d = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
             return d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else {
             const d = new Date();
             d.setDate(d.getDate() + duration);
             return d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    };

    const handleAction = () => {
        if (!customerName) {
            alert("Ingrese un nombre de cliente");
            return;
        }
        if (!platformId) {
            alert("Seleccione una plataforma");
            return;
        }

        let finalCustomerId = customerId;

        // Create customer if needed
        if (!finalCustomerId && customerName) {
            const existing = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
            if (existing) {
                finalCustomerId = existing.id;
            } else {
                const newC: Customer = {
                    id: Date.now().toString(),
                    name: customerName,
                    phone: customerPhone,
                    points: 0
                };
                addCustomer(newC);
                finalCustomerId = newC.id;
            }
        }
        
        // Expiration Logic
        let expTimestamp = 0;
        let finalDuration = duration;

        if (expirationMode === 'MANUAL') {
             if (!manualDate) return alert("Seleccione una fecha de vencimiento");
             const parts = manualDate.split('-');
             const d = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
             d.setHours(23, 59, 59); // End of that day
             expTimestamp = d.getTime();
             
             // Recalculate duration days roughly
             const diff = expTimestamp - Date.now();
             finalDuration = Math.ceil(diff / (1000 * 60 * 60 * 24));
        } else {
             expTimestamp = Date.now() + (duration * 24 * 60 * 60 * 1000);
             finalDuration = duration;
        }
        
        const purchaseDate = accountToEdit ? accountToEdit.purchaseDate : Date.now();
        const id = accountToEdit ? accountToEdit.id : Date.now().toString();

        const accountData: StreamingAccount = {
            id,
            platformId,
            customerId: finalCustomerId,
            customerName: customers.find(c => c.id === finalCustomerId)?.name || customerName,
            customerPhone,
            accountEmail,
            accountPassword,
            profileName,
            pin,
            purchaseDate,
            durationDays: finalDuration,
            expirationDate: expTimestamp,
            price: Number(price),
            cost: Number(cost),
            isAdult,
            isTrial,
            status: 'ACTIVE'
        };

        if (accountToEdit) {
            updateStreamingAccount(accountData);
        } else {
            addStreamingAccount(accountData);
        }

        if (sendWhatsApp && customerPhone) {
            const platformName = streamingPlatforms.find(p => p.id === platformId)?.name || 'Streaming';
            const expDateFormatted = new Date(expTimestamp).toLocaleDateString('es-ES');
            
            const message = `*Hola ${customerName}!* Aquí tienes los datos de tu cuenta:
            
🎥 *Plataforma:* ${platformName}
📧 *Usuario:* ${accountEmail}
🔑 *Contraseña:* ${accountPassword}
${profileName ? `👤 *Perfil:* ${profileName}` : ''}
${pin ? `🔢 *PIN:* ${pin}` : ''}
📅 *Vence:* ${expDateFormatted}

Gracias por tu preferencia!`;

            const url = `https://wa.me/521${customerPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="bg-blue-600 p-5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {accountToEdit ? <EditAndSaveIcon /> : <PlayCircle className="w-6 h-6" />} 
                            {accountToEdit ? 'Editar Cuenta de Streaming' : 'Nueva Venta de Streaming'}
                        </h2>
                        <p className="text-blue-200 text-sm">
                            {accountToEdit ? 'Modificar datos de la cuenta existente' : 'Registrar nueva(s) cuenta(s) vendida(s)'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-blue-100 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900">
                    
                    {/* Left Column: Customer & Expiration */}
                    <div className="space-y-5">
                        <div className="space-y-4">
                            <h3 className="text-white font-bold border-b border-slate-700 pb-2">Cliente</h3>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Completo *</label>
                                <div className="relative">
                                    <input 
                                        list="customer-list"
                                        placeholder="Buscar o escribir nombre"
                                        value={customerName}
                                        onChange={(e) => {
                                            setCustomerName(e.target.value);
                                            const found = customers.find(c => c.name === e.target.value);
                                            if (found) {
                                                setCustomerId(found.id);
                                                setCustomerPhone(found.phone || '');
                                            }
                                        }}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 pl-9 text-white outline-none focus:border-blue-500 text-sm"
                                    />
                                    <datalist id="customer-list">
                                        {customers.map(c => <option key={c.id} value={c.name} />)}
                                    </datalist>
                                    <span className="absolute left-3 top-2.5 text-slate-500">👤</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono</label>
                                <div className="relative">
                                    <input 
                                        placeholder="55 1234 5678"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 pl-9 text-white outline-none focus:border-blue-500 text-sm"
                                    />
                                    <span className="absolute left-3 top-2.5 text-slate-500">📞</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <h3 className="text-white font-bold border-b border-slate-700 pb-2">Vencimiento</h3>
                            
                            {/* Toggle Buttons */}
                            <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                                <button 
                                    onClick={() => setExpirationMode('DURATION')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
                                        expirationMode === 'DURATION' 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                                >
                                    <Clock className="w-3 h-3" />
                                    Por Duración
                                </button>
                                <button 
                                    onClick={() => setExpirationMode('MANUAL')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
                                        expirationMode === 'MANUAL' 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                                >
                                    <Calendar className="w-3 h-3" />
                                    Fecha Manual
                                </button>
                            </div>

                            {expirationMode === 'DURATION' ? (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Seleccionar Periodo</label>
                                    <select 
                                        value={duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white outline-none text-sm"
                                    >
                                        <option value={30}>1 mes (30 días)</option>
                                        <option value={60}>2 meses (60 días)</option>
                                        <option value={90}>3 meses (90 días)</option>
                                        <option value={180}>6 meses</option>
                                        <option value={365}>1 año</option>
                                    </select>
                                </div>
                            ) : (
                                <div>
                                     <label className="block text-xs font-medium text-slate-400 mb-1">Fecha de Corte</label>
                                     <input 
                                        type="date"
                                        value={manualDate}
                                        onChange={(e) => setManualDate(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white outline-none text-sm"
                                     />
                                </div>
                            )}
                            
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
                                <p className="text-xs text-blue-300 mb-1">La cuenta vencerá el:</p>
                                <p className="text-sm font-bold text-blue-100 capitalize">
                                    {calculateExpDateDisplay()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Account Details */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                             <h3 className="text-white font-bold">Datos de la Cuenta</h3>
                        </div>

                        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Plataforma *</label>
                                    <select 
                                        value={platformId}
                                        onChange={(e) => setPlatformId(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 text-sm"
                                    >
                                        <option value="">Seleccionar plataforma...</option>
                                        {streamingPlatforms.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} - ${p.suggestedPrice}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Usuario / Email de Acceso *</label>
                                    <input 
                                        type="email"
                                        placeholder="cliente@ejemplo.com"
                                        value={accountEmail}
                                        onChange={(e) => setAccountEmail(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 text-sm font-mono"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Contraseña *</label>
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Contraseña"
                                            value={accountPassword}
                                            onChange={(e) => setAccountPassword(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 text-sm font-mono"
                                        />
                                        <button 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                                            type="button"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Perfil (Opcional)</label>
                                    <div className="relative">
                                        <input 
                                            placeholder="Ej. Pantalla 1"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 pl-9 text-white outline-none text-sm"
                                        />
                                        <span className="absolute left-3 top-2.5 text-slate-500">👤</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">PIN (Opcional)</label>
                                    <div className="relative">
                                        <input 
                                            placeholder="Ej. 1234"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 pl-9 text-white outline-none text-sm"
                                        />
                                        <span className="absolute left-3 top-2.5 text-slate-500">🔑</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Precio de Venta ($)</label>
                                    <input 
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Costo de Inversión ($)</label>
                                    <input 
                                        type="number"
                                        value={cost}
                                        onChange={(e) => setCost(Number(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 text-sm"
                                    />
                                </div>
                                
                                <div className="md:col-span-2 flex gap-6 pt-2 border-t border-slate-700/50 mt-2">
                                     <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={isAdult}
                                            onChange={(e) => setIsAdult(e.target.checked)}
                                            className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                                        />
                                        <span className="text-slate-300 text-xs">Contenido para adultos (+18)</span>
                                     </label>
                                     <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={isTrial}
                                            onChange={(e) => setIsTrial(e.target.checked)}
                                            className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                                        />
                                        <span className="text-slate-300 text-xs">Es cuenta de prueba (Demo)</span>
                                     </label>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="p-5 border-t border-slate-700 bg-slate-800 flex justify-between items-center">
                    <div>
                         <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${sendWhatsApp ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-slate-500'}`}>
                                {sendWhatsApp && <Send className="w-3 h-3 text-white" />}
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={sendWhatsApp}
                                onChange={e => setSendWhatsApp(e.target.checked)}
                            />
                            <span className="text-slate-300 text-sm group-hover:text-white transition-colors">Enviar datos por WhatsApp</span>
                        </label>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-bold">
                            Cancelar
                        </button>
                        <button onClick={handleAction} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2">
                            {accountToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {accountToEdit ? 'Guardar Cambios' : 'Registrar Venta'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

const EditAndSaveIcon = () => (
    <div className="relative w-6 h-6">
        <Save className="w-6 h-6" />
    </div>
);

export default StreamingSaleModal;