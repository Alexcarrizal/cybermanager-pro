import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Settings from './components/Settings';
import CashRegister from './components/CashRegister';
import StreamingManager from './components/StreamingManager';
import ServiceOrdersManager from './components/ServiceOrdersManager';
import Distribution from './components/Distribution';
import Deposits from './components/Deposits';
import FinancialReports from './components/FinancialReports';
import LoginScreen from './components/LoginScreen';
import { CyberProvider, useCyber } from './context/CyberContext';

// Simple custom router hook
const useHashLocation = () => {
  const [loc, setLoc] = useState(window.location.hash.replace(/^#/, '') || '/');
  useEffect(() => {
    const handler = () => setLoc(window.location.hash.replace(/^#/, '') || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return loc;
};

// Main content separated to use context hooks
const MainApp: React.FC = () => {
  const { isAuthenticated, activeCashCut } = useCyber();
  const currentPath = useHashLocation();

  useEffect(() => {
    // Logic: If no active cash cut, redirect dashboard to cash register to force opening
    if (isAuthenticated && !activeCashCut && currentPath !== '/caja') {
        window.location.hash = '#/caja';
    }
  }, [isAuthenticated, activeCashCut, currentPath]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Router Switch Logic
  let Component = Dashboard;
  
  // Force CashRegister if no active cut, regardless of path (double check for rendering safety)
  if (!activeCashCut) {
      Component = CashRegister;
  } else {
      switch (currentPath) {
          case '/': Component = Dashboard; break;
          case '/caja': Component = CashRegister; break;
          case '/distribution': Component = Distribution; break;
          case '/deposits': Component = Deposits; break;
          case '/streaming': Component = StreamingManager; break;
          case '/service-orders': Component = ServiceOrdersManager; break;
          case '/pos': Component = POS; break;
          case '/inventory': Component = Inventory; break;
          case '/reports': Component = FinancialReports; break;
          case '/settings': Component = Settings; break;
          default: Component = Dashboard; break;
      }
  }

  return (
      <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-64 h-full relative overflow-hidden">
           <Component />
        </main>
      </div>
  );
};

const App: React.FC = () => {
  return (
    <CyberProvider>
      <MainApp />
    </CyberProvider>
  );
};

export default App;