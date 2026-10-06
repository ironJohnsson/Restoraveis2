const db = require('../database/db');

async function listar(q = db) {
  return q.all('SELECT * FROM criterios ORDER BY id ASC');
}

async function buscarPorId(id, q = db) {
  return q.get('SELECT * FROM criterios WHERE id = ?', [id]);
}

async function buscarPorCodigo(codigo, q = db) {
  return q.get('SELECT * FROM criterios WHERE UPPER(codigo) = UPPER(?)', [codigo]);
}

/** Próximo código livre no padrão C1, C2, C3... */
async function proximoCodigo(q = db) {
  const codigos = (await q.all('SELECT codigo FROM criterios')).map(c => c.codigo.toUpperCase());
  let n = codigos.length + 1;
  while (codigos.includes(`C${n}`)) n++;
  return `C${n}`;
}

async function criar({ codigo, nome, descricao, tipo, peso = 0, unidade, fonte }, q = db) {
  const criado = await q.get(
    `INSERT INTO criterios (codigo, nome, descricao, tipo, peso, unidade, fonte)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [codigo, nome, descricao ?? null, tipo, peso, unidade ?? null, fonte ?? null]
  );
  return criado.id;
}

async function atualizar(id, { nome, descricao, tipo, unidade, fonte }, q = db) {
  await q.run(
    `UPDATE criterios
     SET nome = COALESCE(?, nome),
         descricao = COALESCE(?, descricao),
         tipo = COALESCE(?, tipo),
         unidade = COALESCE(?, unidade),
         fonte = COALESCE(?, fonte)
     WHERE id = ?`,
    [nome ?? null, descricao ?? null, tipo ?? null, unidade ?? null, fonte ?? null, id]
  );
}

async function definirPeso(id, peso, q = db) {
  await q.run('UPDATE criterios SET peso = ? WHERE id = ?', [peso, id]);
}

async function remover(id, q = db) {
  await q.run('DELETE FROM matriz_decisao WHERE criterio_id = ?', [id]);
  const { changes } = await q.run('DELETE FROM criterios WHERE id = ?', [id]);
  return changes > 0;
}

module.exports = {
  listar,
  buscarPorId,
  buscarPorCodigo,
  proximoCodigo,
  criar,
  atualizar,
  definirPeso,
  remover
};
