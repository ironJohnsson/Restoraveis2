const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Middleware para validar o token JWT no cabeçalho Authorization
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token de autenticação não fornecido no cabeçalho Authorization'
    });
  }

  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Formato do cabeçalho de autenticação inválido. Utilize: Bearer <token>'
    });
  }

  const token = partes[1];

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token JWT inválido ou expirado',
      erro: err.message
    });
  }
}

/**
 * Middleware para validar perfil de acesso do usuário (RBAC)
 * @param  {...string} perfisPermitidos - Perfis autorizados (ex: 'admin', 'pesquisador', 'gestor')
 */
function requireRole(...perfisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário não autenticado'
      });
    }

    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({
        sucesso: false,
        mensagem: `Acesso negado. Perfil '${req.usuario.perfil}' não tem permissão para esta operação`
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
