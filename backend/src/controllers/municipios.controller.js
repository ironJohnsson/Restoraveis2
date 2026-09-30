const db = require('../database/db');

class MunicipiosController {
  static async listar(req, res, next) {
    try {
      const { uf, busca } = req.query;

      let query = 'SELECT * FROM municipios WHERE 1=1';
      const params = [];

      if (uf) {
        query += ' AND uf = ?';
        params.push(uf.toUpperCase());
      }

      if (busca) {
        query += ' AND (nome LIKE ? OR uf LIKE ?)';
        params.push(`%${busca}%`, `%${busca}%`);
      }

      query += ' ORDER BY nome ASC';

      const municipios = await db.all(query, params);

      // Agrega os indicadores da matriz de decisão para cada município
      for (const mun of municipios) {
        const valores = await db.all(`
          SELECT c.codigo, c.nome as criterio_nome, c.tipo, c.unidade, m.valor
          FROM matriz_decisao m
          JOIN criterios c ON c.id = m.criterio_id
          WHERE m.municipio_id = ?
          ORDER BY c.id ASC
        `, [mun.id]);

        mun.indicadores = {};
        mun.indicadoresDetalhe = valores;
        valores.forEach(v => {
          mun.indicadores[v.codigo] = v.valor;
        });
      }

      return res.status(200).json({
        sucesso: true,
        total: municipios.length,
        dados: municipios
      });
    } catch (err) {
      next(err);
    }
  }

  static async obterPorId(req, res, next) {
    try {
      const { id } = req.params;
      const mun = await db.get('SELECT * FROM municipios WHERE id = ?', [id]);

      if (!mun) {
        return res.status(404).json({ sucesso: false, mensagem: 'Município não encontrado' });
      }

      const valores = await db.all(`
        SELECT c.id as criterio_id, c.codigo, c.nome as criterio_nome, c.tipo, c.unidade, c.peso, m.valor
        FROM matriz_decisao m
        JOIN criterios c ON c.id = m.criterio_id
        WHERE m.municipio_id = ?
        ORDER BY c.id ASC
      `, [id]);

      mun.indicadores = {};
      mun.indicadoresDetalhe = valores;
      valores.forEach(v => {
        mun.indicadores[v.codigo] = v.valor;
      });

      return res.status(200).json({ sucesso: true, dados: mun });
    } catch (err) {
      next(err);
    }
  }

  static async criar(req, res, next) {
    try {
      const { nome, uf, populacao, idh, latitude, longitude, indicadores } = req.body;

      if (!nome || !uf || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Nome, UF, Latitude e Longitude são campos obrigatórios'
        });
      }

      const existente = await db.get('SELECT id FROM municipios WHERE nome = ? AND uf = ?', [nome, uf.toUpperCase()]);
      if (existente) {
        return res.status(409).json({
          sucesso: false,
          mensagem: `Município '${nome} - ${uf}' já está cadastrado`
        });
      }

      const result = await db.run(`
        INSERT INTO municipios (nome, uf, populacao, idh, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        nome,
        uf.toUpperCase(),
        populacao ? parseInt(populacao, 10) : null,
        idh ? parseFloat(idh) : null,
        parseFloat(latitude),
        parseFloat(longitude)
      ]);

      const municipioId = result.lastInsertRowid;

      // Inserção dos indicadores na matriz de decisão
      if (indicadores && typeof indicadores === 'object') {
        const criterios = await db.all('SELECT id, codigo FROM criterios');
        for (const crit of criterios) {
          const val = indicadores[crit.codigo];
          if (val !== undefined && val !== null) {
            await db.run(`
              INSERT OR REPLACE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia)
              VALUES (?, ?, ?, ?)
            `, [municipioId, crit.id, parseFloat(val), 2024]);
          }
        }
      }

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Município cadastrado com sucesso',
        municipioId
      });
    } catch (err) {
      next(err);
    }
  }

  static async atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { nome, uf, populacao, idh, latitude, longitude, indicadores } = req.body;

      const mun = await db.get('SELECT id FROM municipios WHERE id = ?', [id]);
      if (!mun) {
        return res.status(404).json({ sucesso: false, mensagem: 'Município não encontrado' });
      }

      await db.run(`
        UPDATE municipios
        SET nome = COALESCE(?, nome),
            uf = COALESCE(?, uf),
            populacao = COALESCE(?, populacao),
            idh = COALESCE(?, idh),
            latitude = COALESCE(?, latitude),
            longitude = COALESCE(?, longitude)
        WHERE id = ?
      `, [
        nome,
        uf ? uf.toUpperCase() : null,
        populacao ? parseInt(populacao, 10) : null,
        idh ? parseFloat(idh) : null,
        latitude !== undefined ? parseFloat(latitude) : null,
        longitude !== undefined ? parseFloat(longitude) : null,
        id
      ]);

      if (indicadores && typeof indicadores === 'object') {
        const criterios = await db.all('SELECT id, codigo FROM criterios');
        for (const crit of criterios) {
          const val = indicadores[crit.codigo];
          if (val !== undefined && val !== null) {
            await db.run(`
              INSERT OR REPLACE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia)
              VALUES (?, ?, ?, ?)
            `, [id, crit.id, parseFloat(val), 2024]);
          }
        }
      }

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Município atualizado com sucesso'
      });
    } catch (err) {
      next(err);
    }
  }

  static async deletar(req, res, next) {
    try {
      const { id } = req.params;
      const mun = await db.get('SELECT id FROM municipios WHERE id = ?', [id]);
      if (!mun) {
        return res.status(404).json({ sucesso: false, mensagem: 'Município não encontrado' });
      }

      await db.run('DELETE FROM matriz_decisao WHERE municipio_id = ?', [id]);
      await db.run('DELETE FROM resultados_ranking WHERE municipio_id = ?', [id]);
      await db.run('DELETE FROM municipios WHERE id = ?', [id]);

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Município removido com sucesso'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MunicipiosController;
