import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, FileText, Download } from 'lucide-react';
import { LogAuditoria } from '../types';

export function AdminAuditoria() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLogs();
  }, []);

  const getActionColor = (acao: string) => {
    switch(acao) {
      case 'LOGIN': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'VENDA': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'CANCELAMENTO_VENDA': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'SANGRIA': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'SUPRIMENTO': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'ABERTURA_CAIXA': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'FECHAMENTO_CAIXA': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="p-6 text-zinc-100 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Histórico de Auditoria</h1>
            <p className="text-zinc-400 text-sm">Registro imutável de operações sensíveis do sistema</p>
          </div>
        </div>
        <button onClick={carregarLogs} className="bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-zinc-700">
          <Activity className="w-4 h-4" /> Atualizar Logs
        </button>
      </div>

      <div className="bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Registros Recentes (Últimos 100)
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-sm">Carregando logs de auditoria...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-zinc-500">
              <FileText className="w-12 h-12 mb-3 text-zinc-700" />
              <p>Nenhum registro de auditoria encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-zinc-900/80 text-zinc-400">
                  <th className="p-4 font-semibold">Data e Hora</th>
                  <th className="p-4 font-semibold">Operador</th>
                  <th className="p-4 font-semibold">Ação</th>
                  <th className="p-4 font-semibold w-full">Detalhes da Operação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 text-zinc-400 font-mono text-xs">
                      {new Date(log.data_hora).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4 font-medium flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                        {log.usuario_nome?.charAt(0) || '?'}
                      </div>
                      {log.usuario_nome || 'Sistema'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 border rounded-md text-[10px] font-bold tracking-wide ${getActionColor(log.acao)}`}>
                        {log.acao.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 truncate max-w-md" title={log.detalhes}>
                      {log.detalhes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
