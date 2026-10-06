const API_BASE = '/api';
const CHAVE_TOKEN = 'topsis.token';

/** Erro devolvido pela API: `message` traz o texto pronto para exibir ao usuário. */
export class ApiError extends Error {
  constructor(mensagem, status, detalhes) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.detalhes = detalhes;
  }
}

let aoPerderSessao = () => {};

/** Token JWT da sessão (some ao fechar a aba). */
export const sessao = {
  token() {
    try {
      return window.sessionStorage.getItem(CHAVE_TOKEN);
    } catch (err) {
      return null;
    }
  },
  salvar(token) {
    window.sessionStorage.setItem(CHAVE_TOKEN, token);
  },
  limpar() {
    window.sessionStorage.removeItem(CHAVE_TOKEN);
  },
  /** Registra o que fazer quando a API responder 401 (token expirado ou revogado). */
  aoPerder(callback) {
    aoPerderSessao = callback;
  }
};

async function requisitar(caminho, { metodo = 'GET', corpo, tipoCorpo = 'application/json', resposta = 'json' } = {}) {
  const cabecalhos = {};
  const token = sessao.token();
  if (token) cabecalhos.Authorization = `Bearer ${token}`;
  if (corpo !== undefined) cabecalhos['Content-Type'] = tipoCorpo;

  let res;
  try {
    res = await fetch(`${API_BASE}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : (tipoCorpo === 'application/json' ? JSON.stringify(corpo) : corpo)
    });
  } catch (err) {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se a API está em execução.', 0);
  }

  if (!res.ok) {
    let dados = null;
    try {
      dados = await res.json();
    } catch (err) {
      // resposta de erro sem JSON (ex.: proxy fora do ar)
    }
    if (res.status === 401 && token && caminho !== '/auth/login') {
      sessao.limpar();
      aoPerderSessao();
    }
    throw new ApiError((dados && dados.mensagem) || `Erro ${res.status} ao comunicar com o servidor`, res.status, dados && dados.detalhes);
  }

  if (resposta === 'blob') return res.blob();
  return res.json();
}

export const api = {
  getStatus: () => requisitar('/status'),

  // Autenticação
  login: (email, senha) => requisitar('/auth/login', { metodo: 'POST', corpo: { email, senha } }),
  me: () => requisitar('/auth/me'),
  alterarSenha: (senhaAtual, novaSenha) => requisitar('/auth/senha', { metodo: 'PUT', corpo: { senhaAtual, novaSenha } }),

  // Usuários (admin)
  getUsuarios: () => requisitar('/usuarios'),
  createUsuario: dados => requisitar('/usuarios', { metodo: 'POST', corpo: dados }),
  updateUsuario: (id, dados) => requisitar(`/usuarios/${id}`, { metodo: 'PUT', corpo: dados }),
  deleteUsuario: id => requisitar(`/usuarios/${id}`, { metodo: 'DELETE' }),

  // Municípios
  getMunicipios: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return requisitar(`/municipios${query ? `?${query}` : ''}`);
  },
  getMunicipio: id => requisitar(`/municipios/${id}`),
  createMunicipio: dados => requisitar('/municipios', { metodo: 'POST', corpo: dados }),
  updateMunicipio: (id, dados) => requisitar(`/municipios/${id}`, { metodo: 'PUT', corpo: dados }),
  deleteMunicipio: id => requisitar(`/municipios/${id}`, { metodo: 'DELETE' }),

  // Critérios
  getCriterios: () => requisitar('/criterios'),
  createCriterio: dados => requisitar('/criterios', { metodo: 'POST', corpo: dados }),
  updateCriterio: (id, dados) => requisitar(`/criterios/${id}`, { metodo: 'PUT', corpo: dados }),
  deleteCriterio: id => requisitar(`/criterios/${id}`, { metodo: 'DELETE' }),
  updatePesos: pesos => requisitar('/criterios/pesos', { metodo: 'PUT', corpo: { pesos } }),

  // TOPSIS e histórico
  executarTopsis: payload => requisitar('/topsis/executar', { metodo: 'POST', corpo: payload }),
  getSimulacoes: (limite) => requisitar(`/simulacoes${limite ? `?limite=${limite}` : ''}`),
  getSimulacao: id => requisitar(`/simulacoes/${id}`),

  // Relatórios: o download exige o token, por isso é feito via fetch (e não por link direto)
  baixarRelatorio: (id, formato) => requisitar(`/relatorios/${id}/${formato}`, { resposta: 'blob' }),

  // Importação de dados externos (admin)
  baixarModeloCsv: () => requisitar('/importacao/modelo.csv', { resposta: 'blob' }),
  importarMunicipiosCsv: csv => requisitar('/importacao/municipios', { metodo: 'POST', corpo: csv, tipoCorpo: 'text/csv' }),
  pesquisarIbge: (uf, nome) => requisitar(`/importacao/ibge/municipios?uf=${encodeURIComponent(uf)}&nome=${encodeURIComponent(nome)}`),
  getMunicipioIbge: codigo => requisitar(`/importacao/ibge/municipios/${encodeURIComponent(codigo)}`),
  getMunicipioPorCep: cep => requisitar(`/importacao/cep/${encodeURIComponent(cep)}`)
};
