const API_BASE = '/api';

export const api = {
  async getStatus() {
    const res = await fetch(`${API_BASE}/status`);
    return res.json();
  },

  async login(email, senha) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    return res.json();
  },

  async getMunicipios(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/municipios${query ? `?${query}` : ''}`);
    return res.json();
  },

  async getMunicipio(id) {
    const res = await fetch(`${API_BASE}/municipios/${id}`);
    return res.json();
  },

  async createMunicipio(dados) {
    const res = await fetch(`${API_BASE}/municipios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    return res.json();
  },

  async updateMunicipio(id, dados) {
    const res = await fetch(`${API_BASE}/municipios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    return res.json();
  },

  async deleteMunicipio(id) {
    const res = await fetch(`${API_BASE}/municipios/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async getCriterios() {
    const res = await fetch(`${API_BASE}/criterios`);
    return res.json();
  },

  async updatePesos(pesos) {
    const res = await fetch(`${API_BASE}/criterios/pesos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pesos })
    });
    return res.json();
  },

  async executarTopsis(payload) {
    const res = await fetch(`${API_BASE}/topsis/executar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getSimulacoes() {
    const res = await fetch(`${API_BASE}/topsis/simulacoes`);
    return res.json();
  },

  async getSimulacao(id) {
    const res = await fetch(`${API_BASE}/topsis/simulacoes/${id}`);
    return res.json();
  },

  getRelatorioCSVUrl(id) {
    return `${API_BASE}/relatorios/${id}/csv`;
  },

  getRelatorioPDFUrl(id) {
    return `${API_BASE}/relatorios/${id}/pdf`;
  }
};
