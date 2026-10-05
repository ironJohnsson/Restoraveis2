const db = require('../database/db');
const Criterio = require('../models/criterio.model');
const HttpError = require('../utils/HttpError');
const v = require('../utils/validacao');

const TOLERANCIA_SOMA = 0.001;

function somaDosPesos(criterios) {
  return criterios.reduce((soma, c) => soma + Number(c.peso || 0), 0);
}

/** RF02 e RF03 — Critérios de vulnerabilidade (UC02) e seus pesos. */
class CriteriosController {
  static async listar(req, res) {
    const criterios = await Criterio.listar();
    res.status(200).json({
      sucesso: true,
      total: criterios.length,
      somaPesos: Number(somaDosPesos(criterios).toFixed(4)),
      dados: criterios
    });
  }

  /** Um critério novo entra com peso 0: a soma dos pesos continua igual a 1. */
  static async criar(req, res) {
    const corpo = req.body || {};
    const nome = v.texto(corpo.nome, 'nome', { max: 150, obrigatorio: true });
    const tipo = v.tipoCriterio(corpo.tipo, { obrigatorio: true });
    const descricao = v.texto(corpo.descricao, 'descricao', { max: 1000 });
    const unidade = v.texto(corpo.unidade, 'unidade', { max: 50 });
    const fonte = v.texto(corpo.fonte, 'fonte', { max: 100 });

    let codigo = v.texto(corpo.codigo, 'codigo', { max: 10 });
    if (codigo) {
      codigo = codigo.toUpperCase();
      if (!/^[A-Z][A-Z0-9_]*$/.test(codigo)) {
        throw new HttpError(400, "O campo 'codigo' deve começar por letra e conter apenas letras, números ou '_'");
      }
      if (await Criterio.buscarPorCodigo(codigo)) {
        throw new HttpError(409, `Já existe um critério com o código ${codigo}`);
      }
    } else {
      codigo = await Criterio.proximoCodigo();
    }

    const criterioId = await Criterio.criar({ codigo, nome, descricao, tipo, peso: 0, unidade, fonte });
    res.status(201).json({ sucesso: true, mensagem: 'Critério cadastrado com sucesso', criterioId, codigo });
  }

  /** Altera nome, descrição, tipo, unidade e fonte. Pesos são alterados em PUT /criterios/pesos. */
  static async atualizar(req, res) {
    const id = v.idParam(req.params.id);
    const corpo = req.body || {};

    if (corpo.peso !== undefined) {
      throw new HttpError(400, 'Para alterar pesos utilize PUT /api/criterios/pesos (a soma deve ser 1)');
    }
    if (!(await Criterio.buscarPorId(id))) {
      throw new HttpError(404, 'Critério não encontrado');
    }

    await Criterio.atualizar(id, {
      nome: v.texto(corpo.nome, 'nome', { max: 150 }),
      descricao: v.texto(corpo.descricao, 'descricao', { max: 1000 }),
      tipo: v.tipoCriterio(corpo.tipo),
      unidade: v.texto(corpo.unidade, 'unidade', { max: 50 }),
      fonte: v.texto(corpo.fonte, 'fonte', { max: 100 })
    });

    res.status(200).json({ sucesso: true, mensagem: 'Critério atualizado com sucesso' });
  }

  /**
   * Atualiza os pesos padrão. Aceita { pesos: { C1: 0.2, ... } } ou { pesos: [{ id, peso }] }.
   * Cada peso deve estar entre 0 e 1 e, após a alteração, a soma de TODOS os critérios
   * deve ser 1 (tolerância de 0,001) — caso contrário nada é gravado.
   */
  static async atualizarPesos(req, res) {
    const { pesos } = req.body || {};
    if (!pesos || typeof pesos !== 'object') {
      throw new HttpError(400, 'O objeto de pesos é obrigatório');
    }

    const criterios = await Criterio.listar();
    const novos = new Map(criterios.map(c => [c.id, Number(c.peso || 0)]));

    const entradas = Array.isArray(pesos)
      ? pesos.map(item => [item && (item.id ?? item.codigo), item && item.peso])
      : Object.entries(pesos);
    if (entradas.length === 0) {
      throw new HttpError(400, 'Informe o peso de ao menos um critério');
    }

    for (const [chave, bruto] of entradas) {
      const criterio = criterios.find(c => String(c.id) === String(chave) || c.codigo.toUpperCase() === String(chave).toUpperCase());
      if (!criterio) {
        throw new HttpError(400, `Critério inexistente: ${chave}`);
      }
      novos.set(criterio.id, v.numero(bruto, `peso de ${criterio.codigo}`, { min: 0, max: 1, obrigatorio: true }));
    }

    const soma = [...novos.values()].reduce((a, b) => a + b, 0);
    if (Math.abs(soma - 1) > TOLERANCIA_SOMA) {
      throw new HttpError(400, `A soma dos pesos de todos os critérios deve ser 1,0 (soma atual: ${soma.toFixed(4)})`);
    }

    await db.transaction(async (tx) => {
      for (const [id, peso] of novos) {
        await Criterio.definirPeso(id, peso, tx);
      }
    });

    res.status(200).json({
      sucesso: true,
      mensagem: 'Pesos dos critérios atualizados com sucesso',
      dados: await Criterio.listar()
    });
  }

  /**
   * Exclui o critério e seus valores na matriz de decisão. O peso do critério
   * excluído é redistribuído proporcionalmente entre os demais (a soma segue 1).
   */
  static async deletar(req, res) {
    const id = v.idParam(req.params.id);

    await db.transaction(async (tx) => {
      const criterios = await Criterio.listar(tx);
      if (!criterios.some(c => c.id === id)) {
        throw new HttpError(404, 'Critério não encontrado');
      }
      if (criterios.length === 1) {
        throw new HttpError(409, 'Não é possível excluir o único critério cadastrado');
      }

      await Criterio.remover(id, tx);

      const restantes = criterios.filter(c => c.id !== id);
      const soma = somaDosPesos(restantes);
      for (const c of restantes) {
        const peso = soma > 0 ? Number(c.peso || 0) / soma : 1 / restantes.length;
        await Criterio.definirPeso(c.id, Number(peso.toFixed(4)), tx);
      }
    });

    res.status(200).json({ sucesso: true, mensagem: 'Critério removido com sucesso' });
  }
}

module.exports = CriteriosController;
