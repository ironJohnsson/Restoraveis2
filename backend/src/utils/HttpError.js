/**
 * Erro de negócio com código HTTP associado.
 * O middleware errorHandler devolve `mensagem` e `detalhes` ao cliente.
 */
class HttpError extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.name = 'HttpError';
    this.status = status;
    this.detalhes = detalhes;
  }
}

module.exports = HttpError;
