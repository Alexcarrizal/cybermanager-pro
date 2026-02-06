import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { Lock, Ghost, ChevronRight } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { login, businessSettings } = useCyber();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(pin);
    if (!success) {
        setError(true);
        setPin('');
        setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-blue-900/20">
                <Ghost className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{businessSettings.name}</h1>
            <p className="text-slate-400 mt-2">CyberManager Pro</p>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                Acceso al Sistema
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">PIN de Acceso</label>
                    <input 
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className={`w-full bg-slate-900 border text-center text-2xl tracking-[0.5em] font-bold rounded-xl py-4 text-white outline-none focus:ring-2 transition-all ${
                            error 
                            ? 'border-rose-500 focus:ring-rose-500 animate-shake' 
                            : 'border-slate-600 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder="••••"
                        maxLength={4}
                        autoFocus
                    />
                    {error && (
                        <p className="text-rose-500 text-sm mt-2 text-center">PIN incorrecto</p>
                    )}
                </div>

                <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group"
                >
                    Ingresar <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>
        </div>
        
        <p className="text-center text-slate-600 text-xs mt-8">
            ID: {Date.now().toString().slice(-6)} • v1.0.0
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;