const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Usuario = require('../models/usuario.model');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');

/**
 * Valida o token JWT do cabeçalho Authorization (Bearer) e carrega o usuário do banco.
 * O perfil usado nas autorizações é sempre o atual do banco: uma conta excluída ou
 * rebaixada perde o acesso imediatamente, mesmo com um token ainda não expirado.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const cabecalho = req.headers.authorization;
  if (!cabecalho) {
    throw new HttpError(401, 'Token de autenticação não fornecido no cabeçalho Authorization');
  }

  const partes = cabecalho.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    throw new HttpError(401, 'Formato do cabeçalho de autenticação inválido. Utilize: Bearer <token>');
  }

  let payload;
  try {
    payload = jwt.verify(partes[1], config.jwtSecret);
  } catch (err) {
    throw new HttpError(401, 'Token JWT inválido ou expirado');
  }

  const usuario = await Usuario.buscarPorId(payload.id);
  if (!usuario) {
    throw new HttpError(401, 'Usuário do token não existe mais');
  }

  req.usuario = usuario;
  next();
});

/**
 * Controle de acesso por perfil (RBAC). Deve vir depois de requireAuth.
 * @param  {...string} perfisPermitidos - 'admin', 'pesquisador' e/ou 'gestor'
 */
function requireRole(...perfisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(new HttpError(401, 'Usuário não autenticado'));
    }
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return next(new HttpError(403, `Acesso negado. Perfil '${req.usuario.perfil}' não tem permissão para esta operação`));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
