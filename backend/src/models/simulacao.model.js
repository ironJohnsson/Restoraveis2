const db = require('../database/db');
const { paraIso } = require('../utils/datas');

const LINHAS_POR_INSERT = 100;

/** `parametros` é JSONB no PostgreSQL (já chega como objeto) e TEXT no SQLite. */
function lerParametros(valor) {
  if (valor && typeof valor === 'object') return valor;
  try {
    return JSON.parse(valor) || {};
  } catch (err) {
    return {};
  }
}

function formatar(simulacao) {
  if (!simulacao) return null;
  return {
    ...simulacao,
    data_execucao: paraIso(simulacao.data_execucao),
    parametros: lerParametros(simulacao.parametros)
  };
}

/**
 * Persiste a simulação e todo o seu ranking em uma única transação
 * (ou tudo é gravado, ou nada). `ranking`: itens com municipioId, ci,
 * distanciaPositiva, distanciaNegativa e posicao.
 */
async function criar({ usuarioId, titulo, dataExecucao, parametros, ranking }) {
  return db.transaction(async (tx) => {
    const simulacao = await tx.get(
      `INSERT INTO simulacoes (usuario_id, titulo, data_execucao, parametros, status)
       VALUES (?, ?, ?, ?, 'concluida') RETURNING id`,
      [usuarioId ?? null, titulo, dataExecucao, JSON.stringify(parametros)]
    );

    for (let inicio = 0; inicio < ranking.length; inicio += LINHAS_POR_INSERT) {
      const lote = ranking.slice(inicio, inicio + LINHAS_POR_INSERT);
      const marcadores = lote.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
      const params = lote.flatMap(item => [
        simulacao.id,
        item.municipioId,
        item.ci,
        item.distanciaPositiva,
        item.distanciaNegativa,
        item.posicao
      ]);
      await tx.run(
        `INSERT INTO resultados_ranking
           (simulacao_id, municipio_id, coeficiente_ci, distancia_positiva, distancia_negativa, posicao)
         VALUES ${marcadores}`,
        params
      );
    }

    return simulacao.id;
  });
}

async function listar({ limite } = {}, q = db) {
  let sql = `
    SELECT s.id, s.titulo, s.data_execucao, s.status, s.parametros, s.usuario_id,
           u.nome AS usuario_nome,
           (SELECT COUNT(*) FROM resultados_ranking r WHERE r.simulacao_id = s.id) AS total_municipios,
           (SELECT m.nome FROM resultados_ranking r
              JOIN municipios m ON m.id = r.municipio_id
             WHERE r.simulacao_id = s.id
             ORDER BY r.posicao ASC LIMIT 1) AS melhor_classificado
    FROM simulacoes s
    LEFT JOIN usuarios u ON u.id = s.usuario_id
    ORDER BY s.id DESC`;
  const params = [];
  if (limite) {
    sql += ' LIMIT ?';
    params.push(limite);
  }
  return (await q.all(sql, params)).map(formatar);
}

async function buscarPorId(id, q = db) {
  return formatar(await q.get(
    `SELECT s.*, u.nome AS usuario_nome, u.email AS usuario_email
     FROM simulacoes s
     LEFT JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.id = ?`,
    [id]
  ));
}

async function resultados(id, q = db) {
  return q.all(
    `SELECT r.posicao, r.coeficiente_ci, r.distancia_positiva, r.distancia_negativa,
            m.id AS municipio_id, m.nome, m.uf, m.populacao, m.idh, m.latitude, m.longitude, m.codigo_ibge
     FROM resultados_ranking r
     JOIN municipios m ON m.id = r.municipio_id
     WHERE r.simulacao_id = ?
     ORDER BY r.posicao ASC`,
    [id]
  );
}

module.exports = { criar, listar, buscarPorId, resultados };
