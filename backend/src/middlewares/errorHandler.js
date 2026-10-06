const HttpError = require('../utils/HttpError');

/**
 * Middleware centralizado de tratamento de erros.
 * Erros de negócio (HttpError) devolvem a própria mensagem; qualquer outro erro
 * vira 500 com mensagem genérica, sem expor detalhes internos ao cliente.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      sucesso: false,
      mensagem: err.message,
      detalhes: err.detalhes
    });
  }

  // Erros do próprio Express/body-parser (JSON malformado, corpo grande demais...)
  if (err && err.status >= 400 && err.status < 500) {
    const mensagem = err.type === 'entity.parse.failed'
      ? 'Corpo da requisição com JSON inválido'
      : err.type === 'entity.too.large'
        ? 'Corpo da requisição excede o tamanho máximo permitido'
        : 'Requisição inválida';
    return res.status(err.status).json({ sucesso: false, mensagem });
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERRO] ${req.method} ${req.originalUrl} - ${err && (err.stack || err.message)}`);
  }
  return res.status(500).json({
    sucesso: false,
    mensagem: 'Erro interno no servidor',
    detalhes: process.env.NODE_ENV === 'development' && err ? err.stack : undefined
  });
}

module.exports = errorHandler;
