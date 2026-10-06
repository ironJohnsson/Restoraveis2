import React, { useState } from 'react';
import { Zap, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email.trim(), senha);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-serif leading-tight">Plataforma Energia Renovável</h1>
            <p className="text-xs text-slate-500">TOPSIS • Vulnerabilidade Social Energética • ODS 7</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              placeholder="seu.nome@orgao.gov.br"
            />
          </div>
          <div>
            <label htmlFor="senha" className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {erro && (
            <div role="alert" data-testid="erro-login" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={enviando || !email || !senha}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{enviando ? 'Entrando...' : 'Entrar'}</span>
          </button>
        </form>

        <p className="mt-6 text-[11px] text-slate-400 text-center">
          O acesso é concedido pelo administrador da plataforma. As contas de demonstração estão descritas no README do projeto.
        </p>
      </div>
    </div>
  );
}
