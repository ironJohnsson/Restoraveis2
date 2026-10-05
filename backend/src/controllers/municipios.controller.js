const Municipio = require('../models/municipio.model');
const MunicipioService = require('../services/municipio.service');
const HttpError = require('../utils/HttpError');
const v = require('../utils/validacao');

/** RF01 — Cadastro de municípios/comunidades e seus indicadores (matriz de decisão). */
class MunicipiosController {
  static async listar(req, res) {
    const uf = req.query.uf ? v.uf(req.query.uf) : undefined;
    const busca = v.texto(req.query.busca, 'busca', { max: 100 }) || undefined;

    const municipios = await Municipio.listar({ uf, busca });
    res.status(200).json({ sucesso: true, total: municipios.length, dados: municipios });
  }

  static async obterPorId(req, res) {
    const municipio = await Municipio.buscarPorId(v.idParam(req.params.id));
    if (!municipio) {
      throw new HttpError(404, 'Município não encontrado');
    }
    res.status(200).json({ sucesso: true, dados: municipio });
  }

  static async criar(req, res) {
    const municipioId = await MunicipioService.criar(req.body || {});
    res.status(201).json({ sucesso: true, mensagem: 'Município cadastrado com sucesso', municipioId });
  }

  static async atualizar(req, res) {
    await MunicipioService.atualizar(v.idParam(req.params.id), req.body || {});
    res.status(200).json({ sucesso: true, mensagem: 'Município atualizado com sucesso' });
  }

  static async deletar(req, res) {
    await MunicipioService.remover(v.idParam(req.params.id));
    res.status(200).json({ sucesso: true, mensagem: 'Município removido com sucesso' });
  }
}

module.exports = MunicipiosController;
