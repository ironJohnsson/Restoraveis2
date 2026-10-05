const bcrypt = require('bcryptjs');
const config = require('../config/config');
const dados = require('./seeds/dados-iniciais');

const MARCADOR_SEED = 'seed:dados-iniciais';

// Hash gravado pelas versões antigas do seed: não correspondia a nenhuma senha
const HASH_LEGADO_INVALIDO = '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qHqXqK/H/V2XhI70h7p3v16l2K5Qkym';

function senhaPadrao() {
  return process.env.SEED_SENHA_PADRAO || '123456';
}

/**
 * Insere critérios, municípios, matriz de decisão e usuários de demonstração.
 * Roda uma única vez por banco (marcador em `schema_migrations`); com `forcar`,
 * assume que as tabelas estão vazias e insere novamente (usado em db.reset()).
 * `q` é um executor de transação.
 */
async function semear(q, { forcar = false } = {}) {
  if (!forcar) {
    const jaExecutado = await q.get('SELECT nome FROM schema_migrations WHERE nome = ?', [MARCADOR_SEED]);
    if (jaExecutado) return false;

    await q.run('INSERT INTO schema_migrations (nome, aplicada_em) VALUES (?, ?)', [
      MARCADOR_SEED,
      new Date().toISOString()
    ]);

    // Banco criado por uma versão anterior da plataforma: já possui dados
    const { total } = await q.get('SELECT COUNT(*) AS total FROM usuarios');
    if (total > 0) return false;
  }

  const agora = new Date().toISOString();

  const idsCriterios = [];
  for (const c of dados.criterios) {
    const criado = await q.get(
      `INSERT INTO criterios (codigo, nome, descricao, tipo, peso, unidade, fonte)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [c.codigo, c.nome, c.descricao, c.tipo, c.peso, c.unidade, c.fonte]
    );
    idsCriterios.push(criado.id);
  }

  for (const m of dados.municipios) {
    const criado = await q.get(
      `INSERT INTO municipios (nome, uf, populacao, idh, latitude, longitude, codigo_ibge, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [m.nome, m.uf, m.populacao, m.idh, m.latitude, m.longitude, m.codigoIbge || null, agora]
    );
    for (let j = 0; j < m.indicadores.length; j++) {
      await q.run(
        'INSERT INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES (?, ?, ?, ?)',
        [criado.id, idsCriterios[j], m.indicadores[j], config.anoReferenciaPadrao]
      );
    }
  }

  const hash = bcrypt.hashSync(senhaPadrao(), config.bcryptRounds);
  for (const u of dados.usuarios) {
    await q.run(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil, created_at) VALUES (?, ?, ?, ?, ?)',
      [u.nome, u.email, hash, u.perfil, agora]
    );
  }

  return true;
}

/**
 * Bancos criados por versões antigas guardavam um hash inválido para as contas de
 * demonstração (o login só funcionava por um atalho inseguro, já removido).
 * Substitui esse hash pelo da senha padrão para que as contas continuem acessíveis.
 */
async function repararHashLegado(q) {
  const { total } = await q.get('SELECT COUNT(*) AS total FROM usuarios WHERE senha_hash = ?', [
    HASH_LEGADO_INVALIDO
  ]);
  if (total === 0) return 0;

  const hash = bcrypt.hashSync(senhaPadrao(), config.bcryptRounds);
  const { changes } = await q.run('UPDATE usuarios SET senha_hash = ? WHERE senha_hash = ?', [
    hash,
    HASH_LEGADO_INVALIDO
  ]);
  return changes;
}

module.exports = { semear, repararHashLegado, HASH_LEGADO_INVALIDO, MARCADOR_SEED };

/* istanbul ignore next -- execução via linha de comando: `npm run seed` */
if (require.main === module) {
  const db = require('./db');
  (async () => {
    await db.init({ log: console.log });
    const tabelas = ['criterios', 'municipios', 'matriz_decisao', 'usuarios'];
    for (const tabela of tabelas) {
      const { total } = await db.get(`SELECT COUNT(*) AS total FROM ${tabela}`);
      console.log(`[SEED] ${tabela}: ${total} registro(s)`);
    }
    await db.close();
  })().catch((err) => {
    console.error('[ERRO] Falha ao carregar os dados iniciais:', err.message);
    process.exit(1);
  });
}
