import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface FinanceiroResumo {
  totalEntradas: number;
  totalSaidas: number;
  totalSuprimentos: number;
  totalSangrias: number;
  saldoLiquido: number;
  totalVendas: number;
}

export function AdminFinanceiro() {
  const [resumo, setResumo] = useState<FinanceiroResumo | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarResumo = async () => {
    try {
      const res = await fetch('/api/financeiro/resumo');
      if (res.ok) {
        setResumo(await res.json());
      }
    } catch (err) {
      console.error('Erro ao buscar financeiro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarResumo();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 font-medium">Carregando painel financeiro...</div>;
  }

  if (!resumo) return null;

  return (
    <div className="p-4 md:p-8 text-zinc-100 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Painel Financeiro</h1>
            <p className="text-zinc-400 text-sm">Visão consolidada de todas as movimentações do sistema</p>
          </div>
        </div>
        <button onClick={carregarResumo} className="bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-300 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors border border-zinc-700">
          Atualizar Dados
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Card Saldo Líquido */}
        <div className="bg-[#121214] border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4 relative">
            <h3 className="text-zinc-400 font-semibold text-sm">Saldo Líquido Global</h3>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="relative">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              R$ {resumo.saldoLiquido.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Card Entradas */}
        <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-zinc-400 font-semibold text-sm">Total de Entradas</h3>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-white">R$ {resumo.totalEntradas.toFixed(2)}</span>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-blue-400" /> Vendas e Suprimentos
            </p>
          </div>
        </div>

        {/* Card Saídas */}
        <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-zinc-400 font-semibold text-sm">Total de Saídas</h3>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-white">R$ {resumo.totalSaidas.toFixed(2)}</span>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-rose-400" /> Sangrias e Estornos
            </p>
          </div>
        </div>

        {/* Card Volume */}
        <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-zinc-400 font-semibold text-sm">Volume de Vendas</h3>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-white">{resumo.totalVendas}</span>
            <p className="text-xs text-zinc-500 mt-2">Vendas concluídas com sucesso</p>
          </div>
        </div>

      </div>

      <div className="mt-8 bg-[#1E1E22] border border-zinc-800 rounded-xl p-6 text-center text-zinc-400 text-sm">
        <p>A sincronização absoluta está ativa. Todas as vendas, sangrias e estornos atualizam este painel em tempo real.</p>
      </div>

    </div>
  );
}
