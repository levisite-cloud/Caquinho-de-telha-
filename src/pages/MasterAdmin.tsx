import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2, Copy, Shield, LogOut } from 'lucide-react';

interface Licenca {
  id: string;
  codigo: string;
  cpf_cnpj: string;
  data_geracao: string;
  validade_dias: number;
  usada: boolean;
  usada_em: string | null;
}

export function MasterAdmin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [sistemaStatus, setSistemaStatus] = useState<{validade: string | null, expirada: boolean, cnpj: string} | null>(null);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [dias, setDias] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLicencasEStatus = async (pwd: string) => {
    try {
      const [resLicencas, resStatus] = await Promise.all([
        fetch(`/api/master/licencas?masterPassword=${encodeURIComponent(pwd)}`),
        fetch(`/api/master/status-sistema?masterPassword=${encodeURIComponent(pwd)}`)
      ]);

      if (resLicencas.ok && resStatus.ok) {
        const dataLic = await resLicencas.json();
        const dataStatus = await resStatus.json();
        setLicencas(dataLic);
        setSistemaStatus(dataStatus);
        setIsAuthenticated(true);
      } else {
        setError('Senha Master incorreta.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    fetchLicencasEStatus(password);
  };

  const gerarLicenca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpfCnpj) return;

    setLoading(true);
    try {
      const res = await fetch('/api/master/licencas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterPassword: password,
          cpf_cnpj: cpfCnpj,
          validade_dias: Number(dias)
        })
      });

      if (res.ok) {
        setCpfCnpj('');
        fetchLicencasEStatus(password);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao gerar.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const forcarDesbloqueio = async () => {
    if (!window.confirm(`Tem certeza que deseja forçar o desbloqueio direto adicionando ${dias} dias ao sistema?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/master/desbloqueio-direto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterPassword: password,
          dias: Number(dias)
        })
      });

      if (res.ok) {
        alert('Sistema desbloqueado com sucesso!');
        fetchLicencasEStatus(password);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao desbloquear.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const forcarBloqueio = async () => {
    if (!window.confirm('Tem certeza que deseja BLOQUEAR o sistema? O cliente perderá acesso na hora.')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/master/bloquear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterPassword: password })
      });

      if (res.ok) {
        alert('Sistema bloqueado com sucesso!');
        fetchLicencasEStatus(password);
      } else {
        alert('Erro ao bloquear.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    alert('Código copiado!');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl max-w-sm w-full border border-gray-700">
          <div className="flex justify-center mb-6">
            <div className="bg-purple-500/20 p-4 rounded-full">
              <Shield size={40} className="text-purple-400" />
            </div>
          </div>
          <h2 className="text-white text-xl font-bold text-center mb-6">Painel Master SaaS</h2>
          
          <input
            type="password"
            placeholder="Senha Master"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded px-4 py-2 mb-4"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded">
            Acessar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <Shield size={32} className="text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Gerador de Licenças</h1>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="text-gray-400 hover:text-white flex items-center gap-2">
            <LogOut size={20} /> Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-3">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Status do Sistema Cliente</h2>
                <p className="text-sm text-gray-400">CNPJ Cadastrado: <strong className="text-gray-200">{sistemaStatus?.cnpj}</strong></p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-400">Validade Atual:</span>
                  {sistemaStatus?.validade ? (
                    <strong className="text-gray-200">{new Date(sistemaStatus.validade).toLocaleDateString('pt-BR')}</strong>
                  ) : (
                    <strong className="text-gray-500">Nunca Ativado</strong>
                  )}
                  {sistemaStatus?.expirada ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">BLOQUEADO</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ATIVO</span>
                  )}
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={forcarBloqueio}
                  disabled={loading || sistemaStatus?.expirada}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Shield size={18} /> Bloquear Sistema
                </button>
                <button
                  type="button"
                  onClick={forcarDesbloqueio}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition-colors flex items-center gap-2"
                >
                  <KeyRound size={18} /> Ativar Sistema (+{dias} dias)
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4">Nova Licença</h2>
              <form onSubmit={gerarLicenca} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">CPF / CNPJ do Cliente</label>
                  <input
                    type="text"
                    required
                    value={cpfCnpj}
                    onChange={e => setCpfCnpj(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Validade (Dias)</label>
                  <select
                    value={dias}
                    onChange={e => setDias(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2"
                  >
                    <option value="30">30 dias</option>
                    <option value="90">90 dias (Trimestral)</option>
                    <option value="180">180 dias (Semestral)</option>
                    <option value="365">365 dias (Anual)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded flex items-center justify-center gap-2"
                >
                  <KeyRound size={18} />
                  {loading ? 'Gerando...' : 'Gerar Código'}
                </button>
              </form>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4">Licenças Geradas</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Dias</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licencas.map(lic => (
                      <tr key={lic.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-900 px-2 py-1 rounded text-emerald-400 font-mono text-sm">
                              {lic.codigo}
                            </code>
                            <button onClick={() => copiarCodigo(lic.codigo)} className="text-gray-500 hover:text-white" title="Copiar">
                              <Copy size={16} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{lic.cpf_cnpj}</td>
                        <td className="px-4 py-3 text-sm">{lic.validade_dias}</td>
                        <td className="px-4 py-3 text-sm">
                          {lic.usada ? (
                            <span className="flex items-center gap-1 text-red-400">
                              <CheckCircle2 size={14} /> Usada
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-400">
                              Livre
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {licencas.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          Nenhuma licença gerada ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
