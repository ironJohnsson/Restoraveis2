import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Mensagem from '../components/Mensagem';
import { useAuth } from '../hooks/useAuth';
import { useMensagem } from '../hooks/useMensagem';
import { api } from '../services/api';
import { PERFIS, formatarDataHora } from '../utils/formato';

const FORM_VAZIO = { id: null, nome: '', email: '', perfil: 'pesquisador', senha: '' };

/** RF08 — Gerenciar usuários e perfis de acesso (somente administradores). */
export default function UsuariosPage() {
  const { usuario: logado } = useAuth();
  const retorno = useMensagem();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(null);
  const [erroForm, setErroForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await api.getUsuarios();
      setUsuarios(res.dados || []);
    } catch (err) {
      retorno.erro(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrir = (dados) => {
    setErroForm(null);
    setForm(dados);
  };

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErroForm(null);
    try {
      const dados = { nome: form.nome, email: form.email, perfil: form.perfil };
      if (form.senha) dados.senha = form.senha;

      if (form.id) {
        await api.updateUsuario(form.id, dados);
        retorno.sucesso('Usuário atualizado com sucesso.');
      } else {
        await api.createUsuario(dados);
        retorno.sucesso('Usuário cadastrado com sucesso.');
      }
      setForm(null);
      await carregar();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (u) => {
    if (!window.confirm(`Excluir o usuário "${u.nome}" (${u.email})?`)) return;
    try {
      await api.deleteUsuario(u.id);
      retorno.sucesso('Usuário removido com sucesso.');
      await carregar();
    } catch (err) {
      retorno.erro(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">Usuários e Perfis de Acesso</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">RF08</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administrador: gerencia municípios, critérios e usuários. Pesquisador: configura critérios e pesos. Gestor Público: executa simulações e exporta relatórios.
          </p>
        </div>
        <button type="button" data-testid="novo-usuario" onClick={() => abrir(FORM_VAZIO)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      <Mensagem mensagem={retorno.mensagem} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" data-testid="tabela-usuarios">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Cadastrado em</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {u.nome}
                    {u.id === logado.id && <span className="ml-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">você</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {PERFIS[u.perfil] || u.perfil}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{formatarDataHora(u.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-1">
                      <button type="button" onClick={() => abrir({ id: u.id, nome: u.nome, email: u.email, perfil: u.perfil, senha: '' })}
                        title="Editar usuário" aria-label={`Editar ${u.nome}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => excluir(u)} disabled={u.id === logado.id}
                        title={u.id === logado.id ? 'Você não pode excluir a própria conta' : 'Excluir usuário'} aria-label={`Excluir ${u.nome}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg font-serif mb-4">
              {form.id ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
            </h3>
            <form onSubmit={salvar} className="space-y-3" data-testid="form-usuario">
              <div>
                <label htmlFor="usuario-nome" className="block text-xs font-semibold text-slate-700 mb-1">Nome *</label>
                <input id="usuario-nome" required maxLength={150} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label htmlFor="usuario-email" className="block text-xs font-semibold text-slate-700 mb-1">E-mail *</label>
                <input id="usuario-email" type="email" required maxLength={150} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label htmlFor="usuario-perfil" className="block text-xs font-semibold text-slate-700 mb-1">Perfil de acesso *</label>
                <select id="usuario-perfil" value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  {Object.entries(PERFIS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="usuario-senha" className="block text-xs font-semibold text-slate-700 mb-1">
                  {form.id ? 'Nova senha (deixe em branco para manter a atual)' : 'Senha * (mínimo 8 caracteres)'}
                </label>
                <input id="usuario-senha" type="password" autoComplete="new-password" required={!form.id} minLength={8} value={form.senha}
                  onChange={e => setForm({ ...form, senha: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500" />
              </div>

              {erroForm && <p role="alert" className="text-xs font-semibold text-rose-700">{erroForm}</p>}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setForm(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs disabled:opacity-50">
                  {salvando ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
