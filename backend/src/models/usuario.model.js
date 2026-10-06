const db = require('../database/db');
const { paraIso } = require('../utils/datas');

const COLUNAS_PUBLICAS = 'id, nome, email, perfil, created_at';

function formatar(usuario) {
  if (!usuario) return null;
  return { ...usuario, created_at: paraIso(usuario.created_at) };
}

async function listar(q = db) {
  const usuarios = await q.all(`SELECT ${COLUNAS_PUBLICAS} FROM usuarios ORDER BY nome ASC`);
  return usuarios.map(formatar);
}

async function buscarPorId(id, q = db) {
  return formatar(await q.get(`SELECT ${COLUNAS_PUBLICAS} FROM usuarios WHERE id = ?`, [id]));
}

/** Inclui o hash da senha: uso exclusivo da autenticação. */
async function buscarComSenhaPorEmail(email, q = db) {
  return q.get('SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)', [email]);
}

async function buscarComSenhaPorId(id, q = db) {
  return q.get('SELECT * FROM usuarios WHERE id = ?', [id]);
}

async function criar({ nome, email, senhaHash, perfil }, q = db) {
  const criado = await q.get(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil, created_at)
     VALUES (?, ?, ?, ?, ?) RETURNING id`,
    [nome, email, senhaHash, perfil, new Date().toISOString()]
  );
  return criado.id;
}

async function atualizar(id, { nome, email, perfil, senhaHash }, q = db) {
  await q.run(
    `UPDATE usuarios
     SET nome = COALESCE(?, nome),
         email = COALESCE(?, email),
         perfil = COALESCE(?, perfil),
         senha_hash = COALESCE(?, senha_hash)
     WHERE id = ?`,
    [nome ?? null, email ?? null, perfil ?? null, senhaHash ?? null, id]
  );
}

async function remover(id, q = db) {
  const { changes } = await q.run('DELETE FROM usuarios WHERE id = ?', [id]);
  return changes > 0;
}

async function contarAdmins(q = db) {
  const { total } = await q.get("SELECT COUNT(*) AS total FROM usuarios WHERE perfil = 'admin'");
  return total;
}

module.exports = {
  listar,
  buscarPorId,
  buscarComSenhaPorEmail,
  buscarComSenhaPorId,
  criar,
  atualizar,
  remover,
  contarAdmins
};
