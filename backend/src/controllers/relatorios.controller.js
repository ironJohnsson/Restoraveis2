const PDFDocument = require('pdfkit');
const db = require('../database/db');

class RelatoriosController {
  /**
   * Exporta os resultados da simulação em formato CSV delimitado por ponto e vírgula
   */
  static async exportarCSV(req, res, next) {
    try {
      const { id } = req.params;

      const simulacao = await db.get('SELECT * FROM simulacoes WHERE id = ?', [id]);
      if (!simulacao) {
        return res.status(404).json({ sucesso: false, mensagem: 'Simulação não encontrada' });
      }

      const resultados = await db.all(`
        SELECT r.posicao, m.nome, m.uf, m.populacao, m.idh,
               r.coeficiente_ci, r.distancia_positiva, r.distancia_negativa,
               m.latitude, m.longitude
        FROM resultados_ranking r
        JOIN municipios m ON m.id = r.municipio_id
        WHERE r.simulacao_id = ?
        ORDER BY r.posicao ASC
      `, [id]);

      let csv = 'Posição;Município;UF;População;IDH;Coeficiente Ci;Distância Positiva (D+);Distância Negativa (D-);Classificação;Latitude;Longitude\n';

      resultados.forEach(r => {
        let classificacao = 'Alta Vulnerabilidade';
        if (r.coeficiente_ci >= 0.70) classificacao = 'Baixa Vulnerabilidade';
        else if (r.coeficiente_ci >= 0.40) classificacao = 'Média Vulnerabilidade';

        csv += `${r.posicao};"${r.nome}";${r.uf};${r.populacao || ''};${r.idh || ''};${r.coeficiente_ci.toFixed(6)};${r.distancia_positiva.toFixed(6)};${r.distancia_negativa.toFixed(6)};"${classificacao}";${r.latitude};${r.longitude}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_topsis_simulacao_${id}.csv`);
      return res.status(200).send('\uFEFF' + csv); // Inclui BOM para compatibilidade com Excel no Windows
    } catch (err) {
      next(err);
    }
  }

  /**
   * Gera relatório executivo e técnico em PDF formatado
   */
  static async exportarPDF(req, res, next) {
    try {
      const { id } = req.params;

      const simulacao = await db.get(`
        SELECT s.*, u.nome as usuario_nome
        FROM simulacoes s
        LEFT JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.id = ?
      `, [id]);

      if (!simulacao) {
        return res.status(404).json({ sucesso: false, mensagem: 'Simulação não encontrada' });
      }

      const resultados = await db.all(`
        SELECT r.posicao, m.nome, m.uf, m.populacao, m.idh,
               r.coeficiente_ci, r.distancia_positiva, r.distancia_negativa
        FROM resultados_ranking r
        JOIN municipios m ON m.id = r.municipio_id
        WHERE r.simulacao_id = ?
        ORDER BY r.posicao ASC
      `, [id]);

      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_topsis_simulacao_${id}.pdf`);
      doc.pipe(res);

      // Cabeçalho
      doc.fillColor('#166534').fontSize(18).text('Plataforma de Energia Renovável com TOPSIS', { align: 'center' });
      doc.fontSize(11).fillColor('#4b5563').text('Mensuração Multicritério de Vulnerabilidade Social Energética (ODS 7 - ONU)', { align: 'center' });
      doc.moveDown(0.5);
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(1);

      // Metadados do Relatório
      doc.fillColor('#0f172a').fontSize(14).text(`Relatório da Simulação #${simulacao.id}: ${simulacao.titulo}`);
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Data de Execução: ${new Date(simulacao.data_execucao).toLocaleString('pt-BR')}`);
      doc.text(`Responsável Técnico: ${simulacao.usuario_nome || 'Sistema'}`);
      doc.text(`Total de Alternativas Avaliadas: ${resultados.length}`);
      doc.moveDown(1);

      // Síntese Executiva para Gestores
      doc.fillColor('#1e293b').fontSize(12).text('1. Síntese Executiva e Recomendações');
      doc.fontSize(9).fillColor('#475569');
      doc.text(
        'O método TOPSIS classifica as alternativas pela proximidade relativa à solução ideal positiva e distância da negativa. ' +
        'Municípios com menor coeficiente Ci apresentam maior vulnerabilidade social energética e devem ser priorizados em ' +
        'programas governamentais de eletrificação rural, subsídios tarifários sociais e instalação de usinas solares comunitárias.',
        { align: 'justify' }
      );
      doc.moveDown(1);

      // Tabela de Classificação
      doc.fillColor('#1e293b').fontSize(12).text('2. Classificação Oficial (Ranking TOPSIS)');
      doc.moveDown(0.5);

      // Linha de cabeçalho da tabela
      const topY = doc.y;
      doc.rect(40, topY, 515, 20).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('Pos', 45, topY + 5);
      doc.text('Município / UF', 75, topY + 5);
      doc.text('População', 230, topY + 5);
      doc.text('IDH', 300, topY + 5);
      doc.text('D+', 350, topY + 5);
      doc.text('D-', 400, topY + 5);
      doc.text('Coef. Ci', 450, topY + 5);
      doc.text('Diagnóstico', 500, topY + 5);

      doc.font('Helvetica');
      let currentY = topY + 22;

      resultados.forEach((r, idx) => {
        if (currentY > 750) {
          doc.addPage();
          currentY = 40;
        }

        if (idx % 2 === 1) {
          doc.rect(40, currentY - 2, 515, 18).fill('#f8fafc');
        }

        let corTexto = '#0f172a';
        let diag = 'Alta Vuln.';
        if (r.coeficiente_ci >= 0.70) {
          diag = 'Baixa Vuln.';
          corTexto = '#16a34a';
        } else if (r.coeficiente_ci >= 0.40) {
          diag = 'Média Vuln.';
          corTexto = '#d97706';
        } else {
          corTexto = '#dc2626';
        }

        doc.fillColor('#334155').fontSize(8.5);
        doc.text(String(r.posicao), 45, currentY);
        doc.text(`${r.nome} (${r.uf})`, 75, currentY);
        doc.text(r.populacao ? r.populacao.toLocaleString('pt-BR') : '-', 230, currentY);
        doc.text(r.idh ? r.idh.toFixed(3) : '-', 300, currentY);
        doc.text(r.distancia_positiva.toFixed(4), 350, currentY);
        doc.text(r.distancia_negativa.toFixed(4), 400, currentY);
        doc.fillColor(corTexto).font('Helvetica-Bold').text(r.coeficiente_ci.toFixed(4), 450, currentY);
        doc.font('Helvetica').text(diag, 500, currentY);

        currentY += 18;
      });

      doc.moveDown(2);
      doc.y = currentY + 15;
      doc.fillColor('#94a3b8').fontSize(8).text(
        'Relatório gerado em conformidade com as normas ISO/IEC 12207 e ISO/IEC 25010. Plataforma TOPSIS de Energia Renovável.',
        { align: 'center' }
      );

      doc.end();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = RelatoriosController;
