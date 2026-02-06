import React, { useState } from 'react';
import { useCyber } from '../context/CyberContext';
import { StreamingAccount } from '../types';
import { X, Save, StickyNote } from 'lucide-react';

interface Props {
    account: StreamingAccount;
    onClose: () => void;
}

const StreamingNotesModal: React.FC<Props> = ({ account, onClose }) => {
    const { updateStreamingAccount } = useCyber();
    const [notes, setNotes] = useState(account.notes || '');

    const handleSave = () => {
        updateStreamingAccount({
            ...account,
            notes: notes.trim()
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-amber-500/10 p-4 border-b border-amber-500/20 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                        <StickyNote className="w-5 h-5" /> Notas de la Cuenta
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-5">
                    <p className="text-sm text-slate-400 mb-2">
                        Cliente: <span className="text-white font-medium">{account.customerName}</span>
                    </p>
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full h-40 bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500 resize-none placeholder-slate-600"
                        placeholder="Escribe aquí contraseñas adicionales, recordatorios o detalles del cliente..."
                        autoFocus
                    />
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-end gap-2">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-900/20"
                    >
                        <Save className="w-4 h-4" /> Guardar Notas
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StreamingNotesModal;