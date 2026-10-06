const SimulacaoService = require('../services/simulacao.service');
const v = require('../utils/validacao');

/** RF04 e RF10 — Execução do TOPSIS (UC03) e histórico de simulações. */
class TopsisController {
  static async executar(req, res) {
    const resultado = await SimulacaoService.executar(req.body || {}, req.usuario);
    res.status(200).json({
      sucesso: true,
      mensagem: 'Cálculo TOPSIS executado com sucesso',
      ...resultado
    });
  }

  static async historico(req, res) {
    const limite = v.numero(req.query.limite, 'limite', { min: 1, max: 500, inteiro: true }) || undefined;
    const simulacoes = await SimulacaoService.listar({ limite });
    res.status(200).json({ sucesso: true, total: simulacoes.length, dados: simulacoes });
  }

  static async obterSimulacao(req, res) {
    const simulacao = await SimulacaoService.obter(v.idParam(req.params.id));
    res.status(200).json({ sucesso: true, dados: simulacao });
  }
}

module.exports = TopsisController;
