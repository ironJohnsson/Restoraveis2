/**
 * Middleware centralizado de tratamento de erros
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERRO] ${req.method} ${req.url} - ${err.stack || err.message}`);

  const status = err.status || 500;
  res.status(status).json({
    sucesso: false,
    mensagem: err.message || 'Erro interno no servidor',
    detalhes: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;
