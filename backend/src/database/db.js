const config = require('../config/config');
const { migrar } = require('./migrate');
const { semear, repararHashLegado } = require('./seed');

/**
 * Fachada de acesso ao banco relacional.
 *
 * - Sem DATABASE_URL: SQLite local (sql.js), ideal para desenvolvimento e testes.
 * - Com DATABASE_URL: PostgreSQL + PostGIS (implantação via Docker Compose).
 *
 * Todo o SQL do projeto é escrito no subconjunto comum aos dois bancos, com
 * marcadores `?`. Os models recebem um executor `q` (esta fachada ou uma transação).
 */
const TABELAS = ['resultados_ranking', 'simulacoes', 'matriz_decisao', 'municipios', 'criterios', 'usuarios'];

let adapter = null;
let inicializacao = null;

function criarAdapter() {
  if (config.databaseUrl) {
    const PostgresAdapter = require('./adapters/postgres');
    return new PostgresAdapter(config.databaseUrl);
  }
  const SqliteAdapter = require('./adapters/sqlite');
  return new SqliteAdapter(config.dbPath);
}

/** Conecta, aplica as migrations pendentes e carrega os dados iniciais em um banco vazio. */
function init({ log } = {}) {
  if (!inicializacao) {
    inicializacao = (async () => {
      adapter = criarAdapter();
      await adapter.conectar();
      await migrar(adapter, { log });
      await adapter.transaction(async (tx) => {
        await semear(tx);
        await repararHashLegado(tx);
      });
      return adapter;
    })().catch((err) => {
      inicializacao = null;
      throw err;
    });
  }
  return inicializacao;
}

async function all(sql, params = []) {
  return (await init()).all(sql, params);
}

async function get(sql, params = []) {
  return (await init()).get(sql, params);
}

async function run(sql, params = []) {
  return (await init()).run(sql, params);
}

async function transaction(fn) {
  return (await init()).transaction(fn);
}

/** Apaga todos os dados e recarrega os seeds. Usado pelos testes automatizados. */
async function reset() {
  const ativo = await init();
  await ativo.truncar(TABELAS);
  await ativo.transaction(tx => semear(tx, { forcar: true }));
}

async function close() {
  if (!inicializacao) return;
  const ativo = await inicializacao.catch(() => null);
  inicializacao = null;
  adapter = null;
  if (ativo) await ativo.fechar();
}

module.exports = {
  init,
  all,
  get,
  run,
  transaction,
  reset,
  close,
  get dialect() {
    return adapter ? adapter.dialect : null;
  }
};
