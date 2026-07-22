import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, KeyRound, ShieldAlert } from 'lucide-react';
import { Usuario, CargoUsuario } from '../types';

export function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState<CargoUsuario>('Caixa');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const carregarUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios');
      if (res.ok) {
        setUsuarios(await res.json());
      }
    } catch (err) {
      console.error('Erro ao buscar usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4 || pin.length > 6) {
      setError('O PIN deve ter entre 4 e 6 dígitos.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cargo, pin })
      });
      if (res.ok) {
        setSuccess('Usuário cadastrado com sucesso!');
        setNome('');
        setPin('');
        carregarUsuarios();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao cadastrar.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }
  };

  const handleDeletar = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return;
    try {
      await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
      carregarUsuarios();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 text-zinc-100 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Gestão de Usuários</h1>
          <p className="text-zinc-400 text-sm">Controle de acessos e PINs dos operadores</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-[#121214] border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
            <UserPlus className="w-4 h-4 text-amber-500" />
            Novo Operador
          </h2>
          
          <form onSubmit={handleSalvar} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 font-bold mb-1 block">Nome Completo</label>
              <input value={nome} onChange={e => setNome(e.target.value)} required type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="Ex: Carlos Silva" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-bold mb-1 block">Cargo / Nível</label>
              <select value={cargo} onChange={e => setCargo(e.target.value as CargoUsuario)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
                <option value="Caixa">Operador de Caixa</option>
                <option value="Atendente">Atendente / Garçom</option>
                <option value="Gerente">Gerente</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-bold mb-1 block">PIN de Acesso (4-6 dígitos)</label>
              <div className="relative">
                <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} required type="password" maxLength={6} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 py-2 text-sm focus:outline-none focus:border-amber-500 tracking-widest font-mono" placeholder="****" />
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && <p className="text-rose-500 text-xs font-bold">{error}</p>}
            {success && <p className="text-emerald-500 text-xs font-bold">{success}</p>}

            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm py-2.5 rounded-lg transition-colors mt-2">
              Salvar Usuário
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">Usuários Cadastrados</h2>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Carregando usuários...</div>
            ) : usuarios.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Nenhum usuário cadastrado.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-zinc-900/80 text-zinc-400">
                    <th className="p-3 font-semibold">Nome</th>
                    <th className="p-3 font-semibold">Cargo</th>
                    <th className="p-3 font-semibold">Criado em</th>
                    <th className="p-3 font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {usuarios.map(u => (
                    <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="p-3 font-medium flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-bold uppercase">{u.nome.charAt(0)}</div>
                        {u.nome}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.cargo === 'Gerente' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {u.cargo}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-500">{new Date(u.data_criacao).toLocaleDateString()}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDeletar(u.id)} className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
