const db = require('../database/db');

class CriteriosController {
  static async listar(req, res, next) {
    try {
      const criterios = await db.all('SELECT * FROM criterios ORDER BY id ASC');
      return res.status(200).json({
        sucesso: true,
        total: criterios.length,
        dados: criterios
      });
    } catch (err) {
      next(err);
    }
  }

  static async atualizarPesos(req, res, next) {
    try {
      const { pesos } = req.body; // { C1: 0.20, C2: 0.20, ... } ou array [{ id, peso }]

      if (!pesos) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'O objeto de pesos é obrigatório'
        });
      }

      if (Array.isArray(pesos)) {
        for (const item of pesos) {
          await db.run('UPDATE criterios SET peso = ? WHERE id = ?', [parseFloat(item.peso), item.id]);
        }
      } else if (typeof pesos === 'object') {
        for (const [codigo, valor] of Object.entries(pesos)) {
          await db.run('UPDATE criterios SET peso = ? WHERE codigo = ?', [parseFloat(valor), codigo]);
        }
      }

      const atualizados = await db.all('SELECT * FROM criterios ORDER BY id ASC');
      return res.status(200).json({
        sucesso: true,
        mensagem: 'Pesos dos critérios atualizados com sucesso',
        dados: atualizados
      });
    } catch (err) {
      next(err);
    }
  }

  static async atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { nome, descricao, tipo, peso, unidade, fonte } = req.body;

      const criterio = await db.get('SELECT id FROM criterios WHERE id = ?', [id]);
      if (!criterio) {
        return res.status(404).json({ sucesso: false, mensagem: 'Critério não encontrado' });
      }

      await db.run(`
        UPDATE criterios
        SET nome = COALESCE(?, nome),
            descricao = COALESCE(?, descricao),
            tipo = COALESCE(?, tipo),
            peso = COALESCE(?, peso),
            unidade = COALESCE(?, unidade),
            fonte = COALESCE(?, fonte)
        WHERE id = ?
      `, [
        nome,
        descricao,
        tipo ? tipo.toLowerCase() : null,
        peso !== undefined ? parseFloat(peso) : null,
        unidade,
        fonte,
        id
      ]);

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Critério atualizado com sucesso'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CriteriosController;
