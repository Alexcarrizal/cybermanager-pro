import React, { useState, useEffect } from 'react';
import { useCyber } from '../context/CyberContext';
import { ServiceOrder, Customer, OrderStatus } from '../types';
import { X, Save, Tag, Send, Printer, FileText } from 'lucide-react';

interface Props {
  onClose: () => void;
  orderToEdit?: ServiceOrder;
}

const ServiceOrderModal: React.FC<Props> = ({ onClose, orderToEdit }) => {
  const { customers, addCustomer, addServiceOrder, updateServiceOrder, businessSettings } = useCyber();

  // --- Form State ---
  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Device
  const [deviceType, setDeviceType] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [password, setPassword] = useState('');

  // Diagnosis
  const [problemDescription, setProblemDescription] = useState('');
  const [technicalDiagnosis, setTechnicalDiagnosis] = useState('');

  // Status & Tech
  const [technician, setTechnician] = useState('');
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.PENDING);

  // Financials
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [finalCost, setFinalCost] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);

  // Other
  const [notes, setNotes] = useState('');
  const [warranty, setWarranty] = useState('30 días en la reparación. No cubre software o daños por mal uso.');

  useEffect(() => {
    if (orderToEdit) {
      setCustomerId(orderToEdit.customerId || '');
      setCustomerName(orderToEdit.customerName);
      setCustomerPhone(orderToEdit.customerPhone || '');
      setCustomerEmail(orderToEdit.customerEmail || '');
      
      setDeviceType(orderToEdit.deviceType);
      setBrand(orderToEdit.brand);
      setModel(orderToEdit.model);
      setSerialNumber(orderToEdit.serialNumber || '');
      setPassword(orderToEdit.password || '');

      setProblemDescription(orderToEdit.problemDescription);
      setTechnicalDiagnosis(orderToEdit.technicalDiagnosis || '');
      
      setStatus(orderToEdit.status);
      setTechnician(orderToEdit.technician || '');

      setEstimatedCost(orderToEdit.estimatedCost);
      setFinalCost(orderToEdit.finalCost);
      setAdvancePayment(orderToEdit.advancePayment);

      setNotes(orderToEdit.notes || '');
      setWarranty(orderToEdit.warranty || '');
    }
  }, [orderToEdit]);

  // Derived
  const remainingBalance = (finalCost > 0 ? finalCost : estimatedCost) - advancePayment;

  const handleSave = () => {
    if (!customerName) return alert('El nombre del cliente es obligatorio');
    if (!deviceType) return alert('El tipo de equipo es obligatorio');
    if (!problemDescription) return alert('El problema reportado es obligatorio');

    let finalCustomerId = customerId;

    if (!finalCustomerId && customerName) {
        const existing = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
        if (existing) {
            finalCustomerId = existing.id;
        } else {
            const newC: Customer = {
                id: Date.now().toString(),
                name: customerName,
                phone: customerPhone,
                points: 0,
                email: customerEmail
            };
            addCustomer(newC);
            finalCustomerId = newC.id;
        }
    }

    const orderData: ServiceOrder = {
      id: orderToEdit ? orderToEdit.id : Date.now().toString(),
      folio: orderToEdit ? orderToEdit.folio : `#${Date.now().toString().slice(-4)}`,
      entryDate: orderToEdit ? orderToEdit.entryDate : Date.now(),
      
      customerId: finalCustomerId,
      customerName,
      customerPhone,
      customerEmail,

      deviceType,
      brand,
      model,
      serialNumber,
      password,

      problemDescription,
      technicalDiagnosis,
      status,
      technician,

      estimatedCost: Number(estimatedCost),
      finalCost: Number(finalCost),
      advancePayment: Number(advancePayment),

      warranty,
      notes
    };

    if (orderToEdit) {
      updateServiceOrder(orderData);
    } else {
      addServiceOrder(orderData);
    }
    onClose();
  };

  const handleWhatsApp = () => {
      if (!customerPhone) return alert('Se requiere número de teléfono');
      const msg = `*Orden de Servicio ${orderToEdit?.folio || 'Nueva'}*\n\nHola ${customerName}, tu equipo ${brand} ${model} tiene el estado: *${getStatusLabel(status)}*.\n\nSaldo pendiente: $${remainingBalance.toFixed(2)}`;
      window.open(`https://wa.me/521${customerPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePrint = () => {
      // Use current form data or saved order data
      const printFolio = orderToEdit ? orderToEdit.folio : "Nuevo";
      const printDate = new Date().toLocaleDateString();
      const printTime = new Date().toLocaleTimeString();
      
      const balance = (finalCost > 0 ? finalCost : estimatedCost) - advancePayment;

      const orderHTML = `
        <div class="receipt-half">
            <div class="header">
                <div class="logo">💻</div>
                <div class="biz-info">
                    <h1>${businessSettings.name}</h1>
                    <p>${businessSettings.address}</p>
                    <p>Tel/WhatsApp: ${businessSettings.whatsapp} | ${businessSettings.website}</p>
                </div>
                <div class="order-id">
                    <h2>ORDEN DE SERVICIO</h2>
                    <div class="folio">${printFolio}</div>
                </div>
            </div>

            <div class="info-grid">
                <div class="box">
                    <strong>Fecha:</strong> ${printDate} ${printTime}<br>
                    <strong>Cliente:</strong> ${customerName}<br>
                    <strong>Teléfono:</strong> ${customerPhone}<br>
                    <strong>Correo:</strong> ${customerEmail}
                </div>
                <div class="box">
                    <strong>Equipo:</strong> ${deviceType}<br>
                    <strong>Marca/Modelo:</strong> ${brand} / ${model}<br>
                    <strong>Serie:</strong> ${serialNumber}<br>
                    <strong>PIN/Pass:</strong> ${password}
                </div>
            </div>

            <div class="section-title">DETALLES DEL SERVICIO</div>
            <div class="box details-box">
                <p><strong>Falla Reportada:</strong> ${problemDescription}</p>
                <p><strong>Diagnóstico/Trabajo:</strong> ${technicalDiagnosis}</p>
                <p><strong>Notas:</strong> ${notes}</p>
                <p><strong>Garantía:</strong> ${warranty}</p>
            </div>

            <div class="financials">
                <div class="f-item">Total Estimado: $${(finalCost || estimatedCost).toFixed(2)}</div>
                <div class="f-item">Anticipo: $${advancePayment.toFixed(2)}</div>
                <div class="f-item highlight">Saldo Restante: $${balance.toFixed(2)}</div>
            </div>

            <div class="footer">
                <div class="signature">Firma del Cliente (Acepto Términos)</div>
                <div class="signature">Firma del Técnico / Recibido</div>
            </div>
             <p class="terms-text">${businessSettings.footerMessage || 'No nos hacemos responsables por equipos olvidados más de 30 días.'}</p>
        </div>
      `;

      const styles = `
        <style>
            @media print {
                @page { margin: 0.5cm; size: letter; }
                body { font-family: 'Arial', sans-serif; font-size: 11px; color: #000; -webkit-print-color-adjust: exact; }
                .page-container { display: flex; flex-direction: column; height: 98vh; justify-content: space-between; }
                .receipt-half { border: 2px solid #000; padding: 15px; height: 48%; display: flex; flex-direction: column; }
                .cut-line { border-top: 1px dashed #666; width: 100%; margin: 10px 0; position: relative; }
                .cut-line::after { content: '✂ Cortar aquí'; position: absolute; right: 0; top: -10px; font-size: 10px; background: #fff; }
                
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
                .logo { font-size: 30px; }
                .biz-info h1 { margin: 0; font-size: 18px; text-transform: uppercase; }
                .biz-info p { margin: 2px 0; font-size: 10px; }
                .order-id { text-align: right; }
                .order-id h2 { margin: 0; font-size: 12px; }
                .folio { font-size: 18px; font-weight: bold; color: #cc0000; }

                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
                .box { border: 1px solid #ccc; padding: 5px; border-radius: 4px; }
                
                .section-title { background: #eee; padding: 3px; font-weight: bold; text-transform: uppercase; border: 1px solid #000; border-bottom: none; font-size: 10px; }
                .details-box { border: 1px solid #000; height: 100px; margin-bottom: 10px; }
                
                .financials { display: flex; justify-content: flex-end; gap: 15px; margin-bottom: 15px; font-size: 12px; }
                .f-item { padding: 5px 10px; border: 1px solid #ccc; }
                .highlight { background: #eee; font-weight: bold; border: 1px solid #000; }

                .footer { display: flex; justify-content: space-between; margin-top: auto; padding-top: 20px; }
                .signature { border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 10px; }
                .terms-text { text-align: center; font-size: 9px; margin-top: 5px; color: #555; }
            }
        </style>
      `;

      const win = window.open('', '', 'width=800,height=600');
      if (win) {
          win.document.write(`
            <html>
                <head><title>Imprimir Orden ${printFolio}</title>${styles}</head>
                <body>
                    <div class="page-container">
                        ${orderHTML}
                        <div class="cut-line"></div>
                        ${orderHTML}
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

  const handlePrintDeliveryNote = () => {
    const printFolio = orderToEdit ? orderToEdit.folio : "Nuevo";
    const printDate = new Date().toLocaleDateString();
    const printTime = new Date().toLocaleTimeString();
    
    const balance = (finalCost > 0 ? finalCost : estimatedCost) - advancePayment;

    const orderHTML = `
      <div class="receipt-half">
          <div class="header">
              <div class="logo">📦</div>
              <div class="biz-info">
                  <h1>${businessSettings.name}</h1>
                  <p>${businessSettings.address}</p>
                  <p>Tel/WhatsApp: ${businessSettings.whatsapp} | ${businessSettings.website}</p>
              </div>
              <div class="order-id">
                  <h2>NOTA DE ENTREGA</h2>
                  <div class="folio">${printFolio}</div>
              </div>
          </div>

          <div class="info-grid">
              <div class="box">
                  <strong>Fecha Entrega:</strong> ${printDate} ${printTime}<br>
                  <strong>Cliente:</strong> ${customerName}<br>
                  <strong>Teléfono:</strong> ${customerPhone}
              </div>
              <div class="box">
                  <strong>Equipo:</strong> ${deviceType} ${brand} ${model}<br>
                  <strong>Serie:</strong> ${serialNumber}<br>
                  <strong>Técnico:</strong> ${technician}
              </div>
          </div>

          <div class="section-title">DETALLES DEL SERVICIO REALIZADO</div>
          <div class="box details-box">
              <p><strong>Problema:</strong> ${problemDescription}</p>
              <p><strong>Solución:</strong> ${technicalDiagnosis}</p>
              <p><strong>Garantía:</strong> ${warranty}</p>
          </div>

          <div class="financials">
              <div class="f-item">Total: $${(finalCost || estimatedCost).toFixed(2)}</div>
              <div class="f-item">Pagado: $${((finalCost || estimatedCost) - balance).toFixed(2)}</div>
              <div class="f-item highlight">Saldo: $${balance.toFixed(2)}</div>
          </div>

          <div class="footer">
              <div class="signature">
                  Firma del Cliente<br>
                  <span style="font-size: 8px;">Recibí a conformidad y funcionando.</span>
              </div>
              <div class="signature">Entregado Por</div>
          </div>
           <p class="terms-text">Garantía válida solo presentando esta nota. No cubre daños por mal uso, mojado, golpeado o intervenido.</p>
      </div>
    `;

    const styles = `
      <style>
          @media print {
              @page { margin: 0.5cm; size: letter; }
              body { font-family: 'Arial', sans-serif; font-size: 11px; color: #000; -webkit-print-color-adjust: exact; }
              .page-container { display: flex; flex-direction: column; height: 98vh; justify-content: space-between; }
              .receipt-half { border: 2px solid #000; padding: 15px; height: 48%; display: flex; flex-direction: column; }
              .cut-line { border-top: 1px dashed #666; width: 100%; margin: 10px 0; position: relative; }
              .cut-line::after { content: '✂ Cortar aquí'; position: absolute; right: 0; top: -10px; font-size: 10px; background: #fff; }
              
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
              .logo { font-size: 24px; }
              .biz-info h1 { margin: 0; font-size: 16px; text-transform: uppercase; }
              .biz-info p { margin: 1px 0; font-size: 9px; }
              .order-id { text-align: right; }
              .order-id h2 { margin: 0; font-size: 11px; }
              .folio { font-size: 16px; font-weight: bold; }

              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
              .box { border: 1px solid #ccc; padding: 5px; border-radius: 4px; font-size: 10px; }
              
              .section-title { background: #eee; padding: 3px; font-weight: bold; text-transform: uppercase; border: 1px solid #000; border-bottom: none; font-size: 10px; }
              .details-box { border: 1px solid #000; flex-grow: 1; margin-bottom: 10px; padding: 5px; font-size: 10px; }
              
              .financials { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 15px; font-size: 11px; }
              .f-item { padding: 4px 8px; border: 1px solid #ccc; }
              .highlight { background: #eee; font-weight: bold; border: 1px solid #000; }

              .footer { display: flex; justify-content: space-between; margin-top: auto; padding-top: 10px; }
              .signature { border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 10px; }
              .terms-text { text-align: center; font-size: 8px; margin-top: 5px; color: #555; }
          }
      </style>
    `;

    const win = window.open('', '', 'width=800,height=600');
    if (win) {
        win.document.write(`
          <html>
              <head><title>Imprimir Nota de Entrega ${printFolio}</title>${styles}</head>
              <body>
                  <div class="page-container">
                      ${orderHTML}
                      <div class="cut-line"></div>
                      ${orderHTML}
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

  const getStatusLabel = (s: OrderStatus) => {
      const map: Record<string, string> = {
          'PENDING': 'En Revisión',
          'APPROVED': 'Aprobado',
          'IN_PROGRESS': 'En Reparación',
          'REPAIRED': 'Reparado',
          'NOT_REPAIRED': 'No Reparado',
          'DELIVERED': 'Entregado',
          'CANCELLED': 'Cancelado'
      };
      return map[s] || s;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-5xl rounded-lg border border-slate-700 shadow-2xl flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             {orderToEdit ? 'Editar Orden de Servicio' : 'Nueva Orden de Servicio'}
           </h2>
           <button onClick={onClose} className="text-slate-400 hover:text-white">
             <X className="w-6 h-6" />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Customer Info */}
            <div className="space-y-4">
                <h3 className="text-slate-200 font-semibold text-sm border-b border-slate-700 pb-2">Información del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Completo</label>
                        <div className="relative">
                            <input 
                                list="customer-list"
                                value={customerName}
                                onChange={(e) => {
                                    setCustomerName(e.target.value);
                                    const found = customers.find(c => c.name === e.target.value);
                                    if (found) {
                                        setCustomerId(found.id);
                                        setCustomerPhone(found.phone || '');
                                        setCustomerEmail(found.email || '');
                                    }
                                }}
                                className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                                placeholder="Escribe para buscar o añadir..."
                            />
                            <datalist id="customer-list">
                                {customers.map(c => <option key={c.id} value={c.name} />)}
                            </datalist>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono</label>
                        <input 
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Correo Electrónico</label>
                        <input 
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Device Info */}
            <div className="space-y-4">
                <h3 className="text-slate-200 font-semibold text-sm border-b border-slate-700 pb-2">Información del Equipo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Equipo</label>
                        <input 
                            value={deviceType}
                            onChange={(e) => setDeviceType(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                            placeholder="Ej. Laptop, Consola"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Marca</label>
                        <input 
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Modelo</label>
                        <input 
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Número de Serie</label>
                        <input 
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">PIN / Patrón (Opcional)</label>
                        <input 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Diagnostics */}
            <div className="space-y-4">
                <h3 className="text-slate-200 font-semibold text-sm border-b border-slate-700 pb-2">Diagnóstico y Estado</h3>
                
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Problema Reportado por el Cliente</label>
                    <textarea 
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none h-20 resize-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Diagnóstico Técnico</label>
                    <div className="relative">
                        <textarea 
                            value={technicalDiagnosis}
                            onChange={(e) => setTechnicalDiagnosis(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none h-24 resize-none"
                        />
                        <button className="absolute right-2 bottom-2 text-blue-400 text-xs flex items-center gap-1 hover:text-blue-300">
                             <Tag className="w-3 h-3" /> Añadir del Catálogo
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Técnico Asignado</label>
                        <select 
                            value={technician}
                            onChange={(e) => setTechnician(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                        >
                            <option value="">Sin asignar</option>
                            <option value="Técnico Principal">Técnico Principal</option>
                            <option value="Ayudante">Ayudante</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Estado de la Orden</label>
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value as OrderStatus)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                        >
                            <option value={OrderStatus.PENDING}>En Revisión</option>
                            <option value={OrderStatus.APPROVED}>Aprobado</option>
                            <option value={OrderStatus.IN_PROGRESS}>En Reparación</option>
                            <option value={OrderStatus.REPAIRED}>Reparado</option>
                            <option value={OrderStatus.NOT_REPAIRED}>No Reparado</option>
                            <option value={OrderStatus.DELIVERED}>Entregado</option>
                            <option value={OrderStatus.CANCELLED}>Cancelado</option>
                        </select>
                     </div>
                </div>
            </div>

            {/* Financials */}
            <div className="space-y-4">
                 <h3 className="text-slate-200 font-semibold text-sm border-b border-slate-700 pb-2">Costos y Observaciones</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label className="block text-xs font-medium text-slate-400 mb-1">Costo Estimado ($)</label>
                         <input 
                            type="number"
                            value={estimatedCost}
                            onChange={(e) => setEstimatedCost(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-slate-400 mb-1">Costo Final ($)</label>
                         <input 
                            type="number"
                            value={finalCost}
                            onChange={(e) => setFinalCost(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-slate-400 mb-1">Anticipo Recibido ($)</label>
                         <input 
                            type="number"
                            value={advancePayment}
                            onChange={(e) => setAdvancePayment(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-slate-400 mb-1">Saldo Restante ($)</label>
                         <div className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-2.5 text-white text-sm font-bold">
                             ${remainingBalance.toFixed(2)}
                         </div>
                     </div>
                 </div>

                 <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Observaciones Adicionales</label>
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none h-16 resize-none"
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Garantía Aplicada (si aplica)</label>
                    <textarea 
                        value={warranty}
                        onChange={(e) => setWarranty(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-md p-2.5 text-white text-sm focus:border-blue-500 outline-none h-16 resize-none"
                    />
                 </div>
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium flex items-center gap-2">
                <X className="w-4 h-4" /> Cancelar
             </button>
             <button onClick={handlePrint} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium flex items-center gap-2">
                <Printer className="w-4 h-4" /> Imprimir Orden
             </button>
             <button onClick={handlePrintDeliveryNote} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" /> Nota de Entrega
             </button>
             <button onClick={handleWhatsApp} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-sm font-medium flex items-center gap-2">
                <Send className="w-4 h-4" /> Notificar WhatsApp
             </button>
             <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20">
                <Save className="w-4 h-4" /> {orderToEdit ? 'Actualizar Orden' : 'Crear Orden'}
             </button>
        </div>

      </div>
    </div>
  );
};

export default ServiceOrderModal;