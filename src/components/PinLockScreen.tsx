import React, { useState } from 'react';
import { Lock, AlertCircle, ChevronRight, Delete } from 'lucide-react';
import { Usuario } from '../types';

interface Props {
  onUnlock: (usuario: Usuario) => void;
}

export function PinLockScreen({ onUnlock }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        onUnlock(data.usuario);
      } else {
        setError(data.error || 'PIN Incorreto.');
        setPin('');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const addDigit = (d: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + d);
      setError('');
    }
  };

  const removeDigit = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4 text-zinc-100 font-sans">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center shadow-lg mb-4 border border-zinc-800">
            <Lock className="text-amber-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Acesso ao PDV</h1>
          <p className="text-zinc-500 text-sm mt-1">Digite seu PIN de operador</p>
        </div>

        <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="flex justify-center mb-8">
            <div className="flex gap-4">
              {[0, 1, 2, 3].map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'bg-zinc-800'}`} />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl flex items-center gap-2 mb-6 text-sm font-medium border border-rose-500/20">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button key={num} onClick={() => addDigit(num.toString())} className="h-16 bg-zinc-800/40 hover:bg-zinc-700 rounded-2xl text-2xl font-bold transition-colors active:scale-95">
                {num}
              </button>
            ))}
            <button onClick={removeDigit} className="h-16 bg-zinc-800/40 hover:bg-zinc-700 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors active:scale-95">
              <Delete className="w-7 h-7" />
            </button>
            <button onClick={() => addDigit('0')} className="h-16 bg-zinc-800/40 hover:bg-zinc-700 rounded-2xl text-2xl font-bold transition-colors active:scale-95">
              0
            </button>
            <button onClick={() => handleLogin()} disabled={pin.length < 4 || loading} className="h-16 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-zinc-950 rounded-2xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] font-bold active:scale-95">
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => onUnlock({ id: 'master', nome: 'Dono (Master)', cargo: 'Gerente', pin: '0000', data_criacao: new Date().toISOString() })} 
              className="text-xs text-zinc-500 hover:text-amber-500 transition-colors font-semibold underline underline-offset-4"
            >
              Acesso Master (Configurar Sistema)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
