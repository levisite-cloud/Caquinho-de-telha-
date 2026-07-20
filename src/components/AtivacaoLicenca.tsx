import React, { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AtivacaoLicencaProps {
  onSuccess: () => void;
  validadeAtual?: string | null;
}

export function AtivacaoLicenca({ onSuccess, validadeAtual }: AtivacaoLicencaProps) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAtivar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) {
      setError('Por favor, insira o código da licença.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/licenca/ativar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMsg(data.mensagem || 'Licença ativada!');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(data.error || 'Erro ao ativar licença.');
      }
    } catch (err: any) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-red-500/30">
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <div className="bg-red-500/20 p-4 rounded-full mb-4">
            <ShieldAlert size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sistema Bloqueado</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Até o momento não foi registrado o pagamento do sistema. Devido a isso o sistema está bloqueado.<br/>
            Entre em contato com o administrador pelo número <strong>71 98270-4380</strong>.
          </p>
          {validadeAtual && (
            <p className="text-gray-500 text-xs mt-2">
              Vencimento original: {new Date(validadeAtual).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {successMsg ? (
          <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 p-6 rounded-lg text-center flex flex-col items-center">
            <CheckCircle2 size={32} className="mb-2" />
            <p className="font-medium">{successMsg}</p>
            <p className="text-sm mt-2 opacity-80">Redirecionando...</p>
          </div>
        ) : (
          <form onSubmit={handleAtivar} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1">
                Código da Licença de Desbloqueio
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 uppercase font-mono text-center tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-500"
                  placeholder="Ex: LIC-ABCD-1234"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded border border-red-400/20 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${
                loading ? 'bg-red-600/50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Validando...' : 'Liberar Sistema'}
            </button>

            <div className="pt-4 mt-4 border-t border-gray-700 text-center">
              <p className="text-gray-400 text-sm mb-3">Falar com o Administrador</p>
              <a
                href={`https://wa.me/5571982704380?text=Olá!%20Minha%20licença%20do%20PDV%20expirou.%20Gostaria%20de%20regularizar%20o%20pagamento.`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium bg-green-600 hover:bg-green-700 transition-colors"
              >
                Chamar no WhatsApp
              </a>
            </div>
          </form>
        )}

        <div className="text-center mt-6 flex flex-col items-center gap-1">
          <p className="text-xs text-gray-500 font-medium">
            Sistema PDV Seguro &copy; {new Date().getFullYear()}
          </p>
          <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-2">
            Desenvolvido por <a href="https://github.com/levisite-cloud" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400 transition-colors">Levisite Cloud</a>
          </p>
        </div>
      </div>
    </div>
  );
}
