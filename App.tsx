import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Settings from './components/Settings';
import CashRegister from './components/CashRegister';
import StreamingManager from './components/StreamingManager';
import ServiceOrdersManager from './components/ServiceOrdersManager';
import Distribution from './components/Distribution';
import { CyberProvider } from './context/CyberContext';

const App: React.FC = () => {
  return (
    <CyberProvider>
      <Router>
        <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
          <Sidebar />
          <main className="flex-1 ml-64 h-full relative overflow-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/caja" element={<CashRegister />} />
              <Route path="/distribution" element={<Distribution />} />
              <Route path="/streaming" element={<StreamingManager />} />
              <Route path="/service-orders" element={<ServiceOrdersManager />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </CyberProvider>
  );
};

export default App;