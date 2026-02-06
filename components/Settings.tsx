import React, { useState, useEffect, useRef } from 'react';
import { useCyber } from '../context/CyberContext';
import { Tariff, TariffRange, DeviceType, BusinessSettings, DatabaseBackup } from '../types';
import { Trash2, Plus, Settings as SettingsIcon, Save, X, Building2, ChevronDown, Download, Upload, Database, Lock, Eye, EyeOff } from 'lucide-react';
import * as XLSX from 'xlsx';

const Settings: React.FC = () => {
  const { 
      tariffs, updateTariff, addTariff, deleteTariff, 
      businessSettings, updateBusinessSettings,
      importDatabase, exportDatabase
  } = useCyber();

  const [localTariffs, setLocalTariffs] = useState<Tariff[]>([]);
  
  // Ref for scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Business Settings State
  const [bName, setBName] = useState(businessSettings.name);
  const [bAddress, setBAddress] = useState(businessSettings.address);
  const [bWebsite, setBWebsite] = useState(businessSettings.website);
  const [bWhatsapp, setBWhatsapp] = useState(businessSettings.whatsapp);

  // Security State
  const [newPin, setNewPin] = useState(businessSettings.adminPin);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    setLocalTariffs(JSON.parse(JSON.stringify(tariffs))); // Deep copy
  }, [tariffs]);

  // Sync Business Settings only on mount
  useEffect(() => {
      setBName(businessSettings.name);
      setBAddress(businessSettings.address);
      setBWebsite(businessSettings.website);
      setBWhatsapp(businessSettings.whatsapp);
      setNewPin(businessSettings.adminPin);
  }, []); // eslint-disable-line

  const handleUpdateTariffName = (tariffId: string, newName: string) => {
    setLocalTariffs(prev => prev.map(t => t.id === tariffId ? { ...t, name: newName } : t));
  };

  const handleAddRange = (tariffId: string) => {
    setLocalTariffs(prev => prev.map(t => {
      if (t.id === tariffId) {
        const ranges = [...t.ranges].sort((a, b) => a.minMinutes - b.minMinutes);
        const lastRange = ranges[ranges.length - 1];
        const newStart = lastRange ? lastRange.maxMinutes + 1 : 1;
        const newEnd = newStart + 59;
        const rate = lastRange ? (lastRange.price / lastRange.maxMinutes) : (20/60);
        const newPrice = lastRange ? Math.ceil(newEnd * rate) : 20;
        
        const newRange: TariffRange = {
            id: Date.now().toString() + Math.random(),
            minMinutes: newStart,
            maxMinutes: newEnd,
            price: newPrice
        };
        return { ...t, ranges: [...t.ranges, newRange] };
      }
      return t;
    }));
  };

  const handleUpdateRange = (tariffId: string, rangeId: string, field: keyof TariffRange, value: string) => {
    setLocalTariffs(prev => prev.map(t => {
      if (t.id === tariffId) {
        return {
          ...t,
          ranges: t.ranges.map(r => r.id === rangeId ? { ...r, [field]: Number(value) } : r)
        };
      }
      return t;
    }));
  };

  const handleDeleteRange = (tariffId: string, rangeId: string) => {
     setLocalTariffs(prev => prev.map(t => {
         if (t.id === tariffId) {
             return { ...t, ranges: t.ranges.filter(r => r.id !== rangeId) };
         }
         return t;
     }));
  };

  const handleAutocomplete = (tariffId: string) => {
      setLocalTariffs(prev => prev.map(t => {
          if (t.id === tariffId) {
              const existingRanges = [...t.ranges].sort((a, b) => a.minMinutes - b.minMinutes);
              const lastRange = existingRanges[existingRanges.length - 1];
              let currentMax = lastRange ? lastRange.maxMinutes : 0;
              let currentPrice = lastRange ? lastRange.price : 0;
              const rate = (lastRange && lastRange.maxMinutes > 0) ? (currentPrice / lastRange.maxMinutes) : (20 / 60);

              const newRanges = [...existingRanges];
              const targets = [60, 120, 180, 240, 300];
              const futureTargets = targets.filter(m => m > currentMax);
              
              if (futureTargets.length === 0 && currentMax < 300) {
                  futureTargets.push(300);
              }
              
              futureTargets.forEach(target => {
                  const min = currentMax + 1;
                  const max = target;
                  const price = Math.ceil(max * rate);

                  newRanges.push({
                      id: Date.now().toString() + Math.random(),
                      minMinutes: min,
                      maxMinutes: max,
                      price: price
                  });
                  currentMax = max;
              });

              return { ...t, ranges: newRanges };
          }
          return t;
      }));
  };

  const handleAddTariff = () => {
    const newTariff: Tariff = {
        id: Date.now().toString(),
        name: 'Nueva Tarifa',
        deviceType: DeviceType.PC,
        ranges: [
            { id: 'r1', minMinutes: 1, maxMinutes: 15, price: 5 },
            { id: 'r2', minMinutes: 16, maxMinutes: 30, price: 10 },
            { id: 'r3', minMinutes: 31, maxMinutes: 60, price: 20 }
        ]
    };
    setLocalTariffs([...localTariffs, newTariff]);
    setTimeout(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, 100);
  };

  const handleDeleteTariff = (id: string) => {
      if (confirm('¿Estás seguro de eliminar este grupo de tarifas?')) {
          setLocalTariffs(prev => prev.filter(t => t.id !== id));
          deleteTariff(id); 
      }
  };

  const handleSaveTariffs = () => {
      const existingIds = tariffs.map(t => t.id);
      localTariffs.forEach(t => {
          if (!existingIds.includes(t.id)) {
              addTariff(t);
          } else {
              updateTariff(t);
          }
      });
      alert('Tarifas guardadas correctamente.');
  };

  const handleSaveBusiness = () => {
      if (!newPin || newPin.length < 4) {
          alert('El PIN debe tener al menos 4 caracteres.');
          return;
      }

      updateBusinessSettings({
          ...businessSettings,
          name: bName,
          address: bAddress,
          website: bWebsite,
          whatsapp: bWhatsapp,
          adminPin: newPin
      });
      alert('Información del negocio y seguridad actualizada.');
  };

  // --- IMPORT FROM EXCEL ---
  const handleImportClick = () => {
      if (fileInputRef.current) {
          fileInputRef.current.click();
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });

              const backupData: Partial<DatabaseBackup> = {};

              // Helper to safely parse JSON strings from Excel cells
              const parseSheet = (sheetName: string, jsonFields: string[] = []) => {
                  const ws = wb.Sheets[sheetName];
                  if (!ws) return [];
                  const data = XLSX.utils.sheet_to_json<any>(ws);
                  return data.map(row => {
                      const newRow = { ...row };
                      jsonFields.forEach(field => {
                          if (newRow[field] && typeof newRow[field] === 'string') {
                              try {
                                  newRow[field] = JSON.parse(newRow[field]);
                              } catch (e) {
                                  console.warn(`Error parsing JSON field ${field} in sheet ${sheetName}`, e);
                              }
                          }
                      });
                      return newRow;
                  });
              };

              const businessRaw = parseSheet("Resumen", ['distributionRules']);
              if (businessRaw.length > 0) backupData.businessSettings = businessRaw[0];
              backupData.sales = parseSheet("Ventas", ['items']);
              backupData.products = parseSheet("Productos");
              backupData.expenses = parseSheet("Gastos");
              backupData.customers = parseSheet("Clientes");
              backupData.tariffs = parseSheet("Tarifas", ['ranges']);
              backupData.stations = parseSheet("Estaciones", ['currentSession']);
              backupData.streamingAccounts = parseSheet("CuentasStreaming");
              backupData.streamingPlatforms = parseSheet("Plataformas");
              backupData.streamingDistributors = parseSheet("Distribuidores");
              backupData.serviceOrders = parseSheet("Reparaciones");

              if (confirm('ADVERTENCIA: Esta acción REEMPLAZARÁ toda la base de datos actual. ¿Deseas continuar?')) {
                  importDatabase(backupData as DatabaseBackup);
                  alert('Base de datos importada exitosamente. La página se recargará.');
                  window.location.reload();
              }

          } catch (error) {
              console.error(error);
              alert('Error al leer el archivo Excel.');
          } finally {
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsBinaryString(file);
  };

  const scrollDown = () => {
      if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ top: 300, behavior: 'smooth' });
      }
  };

  return (
    <div ref={scrollContainerRef} className="p-8 h-full overflow-y-auto bg-slate-900 relative scroll-smooth">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-white mb-1">Configuración del Sistema</h2>
           <p className="text-slate-400 text-sm">Gestiona datos del negocio y tarifas.</p>
        </div>
        <button onClick={() => window.history.back()} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
        </button>
      </div>

      {/* --- Backup Section --- */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg mb-10">
           <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                <Database className="w-6 h-6 text-emerald-500" />
                <h3 className="text-lg font-bold text-white">Respaldo y Datos</h3>
           </div>
           <div className="flex flex-col md:flex-row gap-4">
               <button 
                  onClick={exportDatabase}
                  className="flex-1 py-4 bg-emerald-700/20 border border-emerald-500/50 hover:bg-emerald-700/40 text-emerald-400 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all group"
               >
                   <Download className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
                   <span>Exportar Base de Datos (Excel)</span>
                   <span className="text-xs font-normal opacity-70">Descarga un archivo .xlsx con toda la info</span>
               </button>

               <button 
                  onClick={handleImportClick}
                  className="flex-1 py-4 bg-blue-700/20 border border-blue-500/50 hover:bg-blue-700/40 text-blue-400 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all group"
               >
                   <Upload className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
                   <span>Importar Base de Datos</span>
                   <span className="text-xs font-normal opacity-70">Restaura desde un archivo Excel (Sobreescribe todo)</span>
               </button>
               <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
               />
           </div>
      </div>

      {/* --- Business & Security Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* Business Info */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg">
               <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                    <Building2 className="w-6 h-6 text-blue-500" />
                    <h3 className="text-lg font-bold text-white">Datos del Negocio</h3>
               </div>
               
               <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Nombre del Negocio</label>
                        <input 
                            type="text"
                            value={bName}
                            onChange={(e) => setBName(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Dirección</label>
                        <input 
                            type="text"
                            value={bAddress}
                            onChange={(e) => setBAddress(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Web / Facebook</label>
                        <input 
                            type="text"
                            value={bWebsite}
                            onChange={(e) => setBWebsite(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">WhatsApp</label>
                        <input 
                            type="text"
                            value={bWhatsapp}
                            onChange={(e) => setBWhatsapp(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>
               </div>
          </div>

          {/* Security */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg flex flex-col">
               <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                    <Lock className="w-6 h-6 text-rose-500" />
                    <h3 className="text-lg font-bold text-white">Seguridad y Acceso</h3>
               </div>
               
               <div className="flex-1 space-y-4">
                    <p className="text-sm text-slate-400">
                        Configura el PIN de acceso al sistema. Este código será solicitado cada vez que inicies la aplicación.
                    </p>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">PIN de Administrador</label>
                        <div className="relative">
                            <input 
                                type={showPin ? "text" : "password"}
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-rose-500 text-center tracking-widest font-bold text-xl"
                                maxLength={4}
                            />
                            <button 
                                onClick={() => setShowPin(!showPin)}
                                className="absolute right-3 top-3.5 text-slate-500 hover:text-white"
                            >
                                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center">Recomendado: 4 dígitos numéricos.</p>
                    </div>
               </div>

               <div className="mt-6 pt-6 border-t border-slate-700">
                   <button 
                      onClick={handleSaveBusiness}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                   >
                       <Save className="w-4 h-4" /> Guardar Todos los Cambios
                   </button>
               </div>
          </div>
      </div>

      {/* --- Tariffs Section --- */}
      <div className="mb-6 flex items-center gap-3 border-b border-slate-700 pb-2">
          <SettingsIcon className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold text-white">Tarifas de Renta</h3>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-32">
        {localTariffs.map((tariff) => (
          <div key={tariff.id} className="bg-slate-800 rounded-lg p-5 border border-slate-700 shadow-lg relative group">
            <div className="flex justify-between items-center mb-4">
              <input 
                 type="text" 
                 value={tariff.name}
                 onChange={(e) => handleUpdateTariffName(tariff.id, e.target.value)}
                 className="bg-transparent text-lg font-bold text-white focus:outline-none focus:border-b border-blue-500 w-full mr-4"
              />
              <button onClick={() => handleDeleteTariff(tariff.id)} className="text-slate-500 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
               {/* Header for easier reading */}
               <div className="flex gap-2 text-xs text-slate-500 uppercase font-semibold px-1">
                   <div className="w-20 text-center">Min Inicio</div>
                   <div className="w-20 text-center">Min Fin</div>
                   <div className="flex-1 text-center">Precio</div>
                   <div className="w-8"></div>
               </div>

               {tariff.ranges.map((range) => (
                   <div key={range.id} className="flex gap-2 items-center">
                       <input 
                          type="number"
                          value={range.minMinutes}
                          onChange={(e) => handleUpdateRange(tariff.id, range.id, 'minMinutes', e.target.value)}
                          className="w-20 bg-slate-700 border border-slate-600 rounded-md p-2 text-center text-white outline-none focus:border-blue-500"
                       />
                       <input 
                          type="number"
                          value={range.maxMinutes}
                          onChange={(e) => handleUpdateRange(tariff.id, range.id, 'maxMinutes', e.target.value)}
                          className="w-20 bg-slate-700 border border-slate-600 rounded-md p-2 text-center text-white outline-none focus:border-blue-500"
                       />
                       <div className="flex-1 relative">
                           <span className="absolute left-3 top-2 text-slate-400">$</span>
                           <input 
                                type="number"
                                value={range.price}
                                onChange={(e) => handleUpdateRange(tariff.id, range.id, 'price', e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 pl-6 text-center text-white outline-none focus:border-blue-500"
                            />
                       </div>
                       <button onClick={() => handleDeleteRange(tariff.id, range.id)} className="w-8 flex justify-center text-slate-600 hover:text-rose-400">
                           <Trash2 className="w-4 h-4" />
                       </button>
                   </div>
               ))}
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={() => handleAddRange(tariff.id)}
                    className="flex-1 py-2 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:border-slate-500 hover:text-slate-300 transition-all text-sm font-medium"
                >
                    + Agregar Rango
                </button>
                <button 
                     onClick={() => handleAutocomplete(tariff.id)}
                     className="flex-1 py-2 border border-blue-900/50 bg-blue-900/10 text-blue-400 rounded-lg hover:bg-blue-900/20 transition-all text-sm font-medium border-dashed"
                >
                    Autocompletar 5 Horas
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Scroll Button */}
      <button 
        onClick={scrollDown}
        className="fixed bottom-24 right-8 z-50 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/40 animate-bounce transition-all border border-blue-400/20"
        title="Ver más información abajo"
      >
        <ChevronDown className="w-6 h-6" />
      </button>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-64 right-0 p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center z-10">
          <button 
             onClick={handleAddTariff}
             className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-all"
          >
              <Plus className="w-5 h-5" /> Agregar Tipo de Tarifa
          </button>

          <div className="flex gap-3">
              <button 
                onClick={() => setLocalTariffs(JSON.parse(JSON.stringify(tariffs)))}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                  Cancelar
              </button>
              <button 
                onClick={handleSaveTariffs}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all"
              >
                  Guardar Tarifas
              </button>
          </div>
      </div>
    </div>
  );
};

export default Settings;