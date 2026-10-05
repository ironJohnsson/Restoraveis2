const ImportacaoService = require('../services/importacao.service');
const IbgeService = require('../services/ibge.service');
const HttpError = require('../utils/HttpError');
const v = require('../utils/validacao');

/** RF09 — Importação de dados de fontes externas (arquivo CSV e APIs do IBGE/ViaCEP). */
class ImportacaoController {
  static async modeloCsv(req, res) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="modelo_importacao_municipios.csv"');
    res.status(200).send(await ImportacaoService.modeloCsv());
  }

  /** Recebe o CSV como texto (Content-Type: text/csv) ou em JSON: { csv: "..." }. */
  static async importarMunicipios(req, res) {
    const csv = typeof req.body === 'string' ? req.body : req.body && req.body.csv;
    if (typeof csv !== 'string' || csv.trim() === '') {
      throw new HttpError(400, 'Envie o conteúdo do arquivo CSV no corpo da requisição');
    }
    const anoReferencia = v.numero(req.query.anoReferencia, 'anoReferencia', { min: 1900, max: 2100, inteiro: true }) || undefined;

    const resultado = await ImportacaoService.importarMunicipios(csv, { anoReferencia });
    res.status(200).json({
      sucesso: true,
      mensagem: `Importação concluída: ${resultado.criados} criado(s), ${resultado.atualizados} atualizado(s), ${resultado.erros.length} linha(s) com erro`,
      ...resultado
    });
  }

  /** Busca por nome dentro de uma UF: /ibge/municipios?uf=BA&nome=irec */
  static async pesquisarIbge(req, res) {
    const uf = v.uf(req.query.uf, { obrigatorio: true });
    const nome = v.texto(req.query.nome, 'nome', { max: 100 }) || '';
    if (nome.length < 2) {
      throw new HttpError(400, "Informe ao menos 2 caracteres no parâmetro 'nome'");
    }
    const dados = await IbgeService.pesquisarMunicipios(uf, nome);
    res.status(200).json({ sucesso: true, total: dados.length, dados });
  }

  static async municipioIbge(req, res) {
    const dados = await IbgeService.buscarMunicipioPorCodigo(req.params.codigo);
    res.status(200).json({ sucesso: true, dados });
  }

  static async municipioPorCep(req, res) {
    const dados = await IbgeService.buscarMunicipioPorCep(req.params.cep);
    res.status(200).json({ sucesso: true, dados });
  }
}

module.exports = ImportacaoController;
