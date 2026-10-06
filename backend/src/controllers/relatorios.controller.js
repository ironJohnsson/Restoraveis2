const SimulacaoService = require('../services/simulacao.service');
const RelatorioService = require('../services/relatorio.service');
const v = require('../utils/validacao');

/** RF06 — Exportação de relatórios (UC04). */
class RelatoriosController {
  static async exportarCSV(req, res) {
    const id = v.idParam(req.params.id);
    const simulacao = await SimulacaoService.obter(id);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_topsis_simulacao_${id}.csv"`);
    res.status(200).send(RelatorioService.gerarCsv(simulacao));
  }

  static async exportarPDF(req, res) {
    const id = v.idParam(req.params.id);
    const simulacao = await SimulacaoService.obter(id);
    const pdf = await RelatorioService.gerarPdf(simulacao);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_topsis_simulacao_${id}.pdf"`);
    res.status(200).end(pdf);
  }
}

module.exports = RelatoriosController;
