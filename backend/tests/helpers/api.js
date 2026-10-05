const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database/db');

const SENHA_PADRAO = '123456';
const CONTAS = {
  admin: 'admin@topsis.gov.br',
  pesquisador: 'pesquisador@topsis.gov.br',
  gestor: 'gestor@topsis.gov.br'
};

async function login(email, senha = SENHA_PADRAO) {
  const res = await request(app).post('/api/auth/login').send({ email, senha });
  return res.body.token;
}

/**
 * Prepara o ambiente de um arquivo de teste de integração: banco limpo com os
 * dados iniciais e um token para cada perfil (ctx.admin, ctx.pesquisador, ctx.gestor).
 */
function prepararApi() {
  const ctx = { app, db };

  beforeAll(async () => {
    await db.reset();
    ctx.admin = await login(CONTAS.admin);
    ctx.pesquisador = await login(CONTAS.pesquisador);
    ctx.gestor = await login(CONTAS.gestor);
  });

  afterAll(async () => {
    await db.close();
  });

  ctx.get = (rota, token) => comToken(request(app).get(rota), token);
  ctx.post = (rota, corpo, token) => comToken(request(app).post(rota), token).send(corpo);
  ctx.put = (rota, corpo, token) => comToken(request(app).put(rota), token).send(corpo);
  ctx.delete = (rota, token) => comToken(request(app).delete(rota), token);

  /** Ids dos municípios do benchmark (seção 7.3), na ordem A, B, C. */
  ctx.idsBenchmark = async () => {
    const res = await ctx.get('/api/municipios?busca=Benchmark', ctx.admin);
    return ['A', 'B', 'C'].map(letra => res.body.dados.find(m => m.nome.startsWith(`Município ${letra}`)).id);
  };

  ctx.municipioPorNome = async (nome) => {
    const res = await ctx.get(`/api/municipios?busca=${encodeURIComponent(nome)}`, ctx.admin);
    return res.body.dados.find(m => m.nome === nome);
  };

  return ctx;
}

function comToken(requisicao, token) {
  return token ? requisicao.set('Authorization', `Bearer ${token}`) : requisicao;
}

module.exports = { prepararApi, login, CONTAS, SENHA_PADRAO };
