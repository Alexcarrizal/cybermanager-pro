import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, Settings, Ghost, Receipt, Tv, Wrench, PieChart, Download, LogOut, Wallet } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCyber } from '../context/CyberContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { exportDatabase, logout } = useCyber();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Panel Principal', icon: LayoutDashboard },
    { path: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
    { path: '/inventory', label: 'Inventario', icon: Package },
    { path: '/service-orders', label: 'Ordenes de Servicio', icon: Wrench },
    { path: '/streaming', label: 'Streaming', icon: Tv },
    { path: '/distribution', label: 'Distribución', icon: PieChart },
    { path: '/deposits', label: 'Depósitos', icon: Wallet },
    { path: '/caja', label: 'Caja', icon: Receipt },
    { path: '/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="bg-blue-600 p-2 rounded-lg">
           <Ghost className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">CyberManager</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                active 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-3">
        <button 
            onClick={exportDatabase}
            className="w-full flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-emerald-600/20 hover:text-emerald-400 text-slate-400 rounded-lg transition-all text-sm font-medium border border-transparent hover:border-emerald-500/30"
        >
            <Download className="w-4 h-4" /> Guardar Respaldo
        </button>

        <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 rounded-lg transition-all text-sm font-medium border border-transparent hover:border-rose-500/30"
        >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
        </button>

        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Estado del sistema</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm text-emerald-400 font-medium">En línea</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;