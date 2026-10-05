import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, sessao } from '../services/api';

const AuthContext = createContext(null);

/** Mantém o usuário autenticado e expõe entrar/sair e a checagem de perfil. */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    sessao.aoPerder(() => setUsuario(null));

    if (!sessao.token()) {
      setCarregando(false);
      return;
    }
    api.me()
      .then(res => setUsuario(res.usuario))
      .catch(() => sessao.limpar())
      .finally(() => setCarregando(false));
  }, []);

  const entrar = useCallback(async (email, senha) => {
    const res = await api.login(email, senha);
    sessao.salvar(res.token);
    setUsuario(res.usuario);
  }, []);

  const sair = useCallback(() => {
    sessao.limpar();
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({
    usuario,
    carregando,
    entrar,
    sair,
    /** true se o perfil do usuário é um dos informados */
    pode: (...perfis) => Boolean(usuario) && perfis.includes(usuario.perfil)
  }), [usuario, carregando, entrar, sair]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return contexto;
}
