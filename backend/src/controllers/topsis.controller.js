const db = require('../database/db');
const TopsisService = require('../services/topsis.service');

class TopsisController {
  static async executar(req, res, next) {
    try {
      const {
        municipioIds,
        criteriosIds,
        pesosPersonalizados,
        titulo = 'Simulação TOPSIS de Vulnerabilidade Energética',
        salvarSimulacao = true
      } = req.body;

      // 1. Carrega critérios ativos
      let queryCriterios = 'SELECT * FROM criterios';
      const paramsCriterios = [];

      if (criteriosIds && Array.isArray(criteriosIds) && criteriosIds.length > 0) {
        const placeholders = criteriosIds.map(() => '?').join(',');
        queryCriterios += ` WHERE id IN (${placeholders}) OR codigo IN (${placeholders})`;
        paramsCriterios.push(...criteriosIds, ...criteriosIds);
      }
      queryCriterios += ' ORDER BY id ASC';

      const criterios = await db.all(queryCriterios, paramsCriterios);
      if (criterios.length === 0) {
        return res.status(400).json({ sucesso: false, mensagem: 'Nenhum critério selecionado para o cálculo' });
      }

      // 2. Determina pesos (se personalizados ou padrão)
      const pesos = criterios.map(c => {
        if (pesosPersonalizados && pesosPersonalizados[c.codigo] !== undefined) {
          return parseFloat(pesosPersonalizados[c.codigo]);
        }
        if (pesosPersonalizados && pesosPersonalizados[c.id] !== undefined) {
          return parseFloat(pesosPersonalizados[c.id]);
        }
        return parseFloat(c.peso) || 0.0;
      });

      // 3. Carrega alternativas (municípios)
      let queryMunicipios = 'SELECT * FROM municipios';
      const paramsMun = [];
      if (municipioIds && Array.isArray(municipioIds) && municipioIds.length > 0) {
        const placeholders = municipioIds.map(() => '?').join(',');
        queryMunicipios += ` WHERE id IN (${placeholders})`;
        paramsMun.push(...municipioIds);
      }
      queryMunicipios += ' ORDER BY id ASC';

      const alternativas = await db.all(queryMunicipios, paramsMun);
      if (alternativas.length === 0) {
        return res.status(400).json({ sucesso: false, mensagem: 'Nenhuma alternativa selecionada para o cálculo' });
      }

      // 4. Monta a matriz de decisão a partir dos dados do banco
      const matriz = [];
      for (const mun of alternativas) {
        const linha = [];
        for (const crit of criterios) {
          const registro = await db.get(`
            SELECT valor FROM matriz_decisao 
            WHERE municipio_id = ? AND criterio_id = ?
            ORDER BY ano_referencia DESC LIMIT 1
          `, [mun.id, crit.id]);

          linha.push(registro ? parseFloat(registro.valor) : 0.0);
        }
        matriz.push(linha);
      }

      // 5. Execução do algoritmo TOPSIS
      const tempoInicio = process.hrtime();
      const resultado = TopsisService.executar({
        alternativas,
        criterios,
        pesos,
        matriz
      });
      const diffTempo = process.hrtime(tempoInicio);
      const tempoExecucaoMs = Number(((diffTempo[0] * 1e3) + (diffTempo[1] * 1e-6)).toFixed(2));
      resultado.tempoExecucaoMs = tempoExecucaoMs;

      // 6. Persistência da simulação
      let simulacaoId = null;
      if (salvarSimulacao) {
        const usuarioId = req.usuario ? req.usuario.id : 1;
        const parametros = JSON.stringify({
          titulo,
          pesos,
          criterios: criterios.map(c => ({ id: c.id, codigo: c.codigo, tipo: c.tipo })),
          municipioIds: alternativas.map(a => a.id),
          tempoExecucaoMs
        });

        const simResult = await db.run(`
          INSERT INTO simulacoes (usuario_id, titulo, data_execucao, parametros, status)
          VALUES (?, ?, datetime('now'), ?, 'concluida')
        `, [usuarioId, titulo, parametros]);

        simulacaoId = simResult.lastInsertRowid;

        for (const item of resultado.ranking) {
          await db.run(`
            INSERT INTO resultados_ranking (simulacao_id, municipio_id, coeficiente_ci, distancia_positiva, distancia_negativa, posicao)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            simulacaoId,
            item.municipioId,
            item.ci,
            item.distanciaPositiva,
            item.distanciaNegativa,
            item.posicao
          ]);
        }
      }

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Cálculo TOPSIS executado com sucesso',
        simulacaoId,
        ...resultado
      });
    } catch (err) {
      next(err);
    }
  }

  static async historico(req, res, next) {
    try {
      const simulacoes = await db.all(`
        SELECT s.id, s.titulo, s.data_execucao, s.status, s.parametros,
               u.nome as usuario_nome,
               (SELECT count(*) FROM resultados_ranking r WHERE r.simulacao_id = s.id) as total_municipios,
               (SELECT m.nome FROM resultados_ranking r JOIN municipios m ON m.id = r.municipio_id WHERE r.simulacao_id = s.id AND r.posicao = 1) as melhor_classificado
        FROM simulacoes s
        LEFT JOIN usuarios u ON u.id = s.usuario_id
        ORDER BY s.id DESC
      `);

      const lista = simulacoes.map(s => {
        let params = {};
        try { params = JSON.parse(s.parametros); } catch(e) {}
        return {
          ...s,
          parametros: params
        };
      });

      return res.status(200).json({
        sucesso: true,
        total: lista.length,
        dados: lista
      });
    } catch (err) {
      next(err);
    }
  }

  static async obterSimulacao(req, res, next) {
    try {
      const { id } = req.params;
      const simulacao = await db.get(`
        SELECT s.*, u.nome as usuario_nome, u.email as usuario_email
        FROM simulacoes s
        LEFT JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.id = ?
      `, [id]);

      if (!simulacao) {
        return res.status(404).json({ sucesso: false, mensagem: 'Simulação não encontrada' });
      }

      const ranking = await db.all(`
        SELECT r.posicao, r.coeficiente_ci as ci, r.distancia_positiva, r.distancia_negativa,
               m.id as municipio_id, m.nome, m.uf, m.populacao, m.idh, m.latitude, m.longitude
        FROM resultados_ranking r
        JOIN municipios m ON m.id = r.municipio_id
        WHERE r.simulacao_id = ?
        ORDER BY r.posicao ASC
      `, [id]);

      ranking.forEach(r => {
        if (r.ci >= 0.70) {
          r.nivelVulnerabilidade = 'Baixa Vulnerabilidade';
          r.corVulnerabilidade = '#22c55e';
        } else if (r.ci >= 0.40) {
          r.nivelVulnerabilidade = 'Média Vulnerabilidade';
          r.corVulnerabilidade = '#eab308';
        } else {
          r.nivelVulnerabilidade = 'Alta Vulnerabilidade';
          r.corVulnerabilidade = '#ef4444';
        }
      });

      let params = {};
      try { params = JSON.parse(simulacao.parametros); } catch(e) {}

      return res.status(200).json({
        sucesso: true,
        dados: {
          ...simulacao,
          parametros: params,
          ranking
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TopsisController;
