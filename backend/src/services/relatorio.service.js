const PDFDocument = require('pdfkit');
const { classificar } = require('../utils/classificacao');

const SEPARADOR = ';';

/** Número no padrão brasileiro (vírgula decimal), compatível com Excel pt-BR e separador ';'. */
function numeroCsv(valor, casas) {
  if (valor === null || valor === undefined || valor === '') return '';
  const n = Number(valor);
  if (!Number.isFinite(n)) return '';
  return (casas === undefined ? String(n) : n.toFixed(casas)).replace('.', ',');
}

/**
 * Escapa um texto para CSV: aspas duplicadas e campo entre aspas. Textos iniciados por
 * = + - @ recebem um apóstrofo para não serem interpretados como fórmula pela planilha.
 */
function textoCsv(valor) {
  let texto = valor === null || valor === undefined ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) {
    texto = `'${texto}`;
  }
  return `"${texto.replace(/"/g, '""')}"`;
}

/**
 * CSV da simulação (RF06): classificação final com os valores originais de cada critério.
 * `simulacao` no formato de simulacao.service (executar/obter).
 */
function gerarCsv(simulacao) {
  const criterios = simulacao.criteriosInfo || [];

  const cabecalho = [
    'Posição', 'Município', 'UF', 'População', 'IDH', 'Coeficiente Ci',
    'Distância Positiva (D+)', 'Distância Negativa (D-)', 'Classificação', 'Latitude', 'Longitude',
    ...criterios.map(c => textoCsv(`${c.codigo} - ${c.nome}${c.unidade ? ` (${c.unidade})` : ''}`))
  ];

  const linhas = simulacao.ranking.map((r) => {
    const valores = r.valoresOriginais || [];
    return [
      r.posicao,
      textoCsv(r.nome),
      r.uf,
      numeroCsv(r.populacao),
      numeroCsv(r.idh, 3),
      numeroCsv(r.ci, 6),
      numeroCsv(r.distanciaPositiva, 6),
      numeroCsv(r.distanciaNegativa, 6),
      textoCsv(classificar(r.ci).nivel),
      numeroCsv(r.latitude),
      numeroCsv(r.longitude),
      ...criterios.map((c, j) => numeroCsv(valores[j]))
    ].join(SEPARADOR);
  });

  // BOM para o Excel reconhecer UTF-8
  return `﻿${[cabecalho.join(SEPARADOR), ...linhas].join('\n')}\n`;
}

const MARGEM = 40;
const LARGURA = 515;
const LIMITE_INFERIOR = 770;

function formatarData(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Bahia', dateStyle: 'short', timeStyle: 'short' });
}

/** Desenha uma tabela simples com quebra de página e cabeçalho repetido. */
function desenharTabela(doc, colunas, linhas) {
  const alturaLinha = 18;

  const cabecalho = () => {
    const y = doc.y;
    doc.rect(MARGEM, y, LARGURA, 20).fill('#f1f5f9');
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    colunas.forEach((col) => {
      doc.text(col.titulo, col.x, y + 6, { width: col.largura, lineBreak: false, ellipsis: true });
    });
    doc.font('Helvetica');
    return y + 22;
  };

  let y = cabecalho();
  linhas.forEach((linha, indice) => {
    if (y + alturaLinha > LIMITE_INFERIOR) {
      doc.addPage();
      doc.y = MARGEM;
      y = cabecalho();
    }
    if (indice % 2 === 1) {
      doc.rect(MARGEM, y - 3, LARGURA, alturaLinha).fill('#f8fafc');
    }
    colunas.forEach((col, j) => {
      const celula = linha[j];
      const texto = celula && typeof celula === 'object' ? celula.texto : celula;
      doc.fillColor((celula && celula.cor) || '#334155')
        .font(celula && celula.negrito ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8.5)
        .text(String(texto), col.x, y, { width: col.largura, lineBreak: false, ellipsis: true });
    });
    y += alturaLinha;
  });

  doc.font('Helvetica');
  doc.x = MARGEM;
  doc.y = y + 8;
}

function tituloSecao(doc, texto) {
  if (doc.y > LIMITE_INFERIOR - 60) {
    doc.addPage();
  }
  doc.x = MARGEM;
  doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(12).text(texto, MARGEM, doc.y, { width: LARGURA });
  doc.font('Helvetica');
  doc.moveDown(0.4);
}

/**
 * Relatório executivo em PDF (RF06): metadados, parâmetros (critérios, tipos e pesos),
 * classificação final e alternativas excluídas. Devolve um Buffer.
 */
function gerarPdf(simulacao) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGEM, size: 'A4' });
    const partes = [];
    doc.on('data', parte => partes.push(parte));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    // Cabeçalho
    doc.fillColor('#166534').fontSize(18).text('Plataforma de Energia Renovável com TOPSIS', { align: 'center' });
    doc.fontSize(11).fillColor('#4b5563')
      .text('Mensuração Multicritério de Vulnerabilidade Social Energética (ODS 7 - ONU)', { align: 'center' });
    doc.moveDown(0.5);
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(MARGEM, doc.y).lineTo(MARGEM + LARGURA, doc.y).stroke();
    doc.moveDown(1);

    // Metadados
    doc.fillColor('#0f172a').fontSize(14)
      .text(`Relatório da Simulação #${simulacao.simulacaoId}: ${simulacao.titulo}`, { width: LARGURA });
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Data de execução: ${formatarData(simulacao.dataExecucao)} (horário de Brasília)`);
    doc.text(`Responsável técnico: ${simulacao.usuarioNome || 'Não identificado'}`);
    doc.text(`Alternativas avaliadas: ${simulacao.ranking.length}`);
    doc.text(`Critérios considerados: ${(simulacao.criteriosInfo || []).length}`);
    doc.moveDown(1);

    // 1. Síntese
    tituloSecao(doc, '1. Síntese Executiva e Recomendações');
    doc.fontSize(9).fillColor('#475569').text(
      'O método TOPSIS classifica as alternativas pela proximidade relativa à solução ideal positiva e pela distância ' +
      'da solução ideal negativa. Municípios com menor coeficiente Ci apresentam maior vulnerabilidade social energética ' +
      'e devem ser priorizados em programas de eletrificação, subsídios tarifários sociais e usinas solares comunitárias.',
      MARGEM, doc.y, { align: 'justify', width: LARGURA }
    );
    const resumo = simulacao.resumoEstatistico || {};
    if (simulacao.ranking.length > 0) {
      doc.moveDown(0.5);
      doc.text(
        `Menor vulnerabilidade: ${resumo.municipioMenosVulneravel}. ` +
        `Maior vulnerabilidade (prioridade de investimento): ${resumo.municipioMaisVulneravel}. ` +
        `Ci médio: ${Number(resumo.ciMedio).toFixed(4)}.`,
        { width: LARGURA }
      );
    }
    doc.moveDown(1);

    // 2. Parâmetros
    const criterios = simulacao.criteriosInfo || [];
    if (criterios.length > 0) {
      tituloSecao(doc, '2. Parâmetros da Simulação (Critérios e Pesos)');
      desenharTabela(doc, [
        { titulo: 'Cód.', x: 45, largura: 35 },
        { titulo: 'Critério', x: 85, largura: 235 },
        { titulo: 'Tipo', x: 325, largura: 60 },
        { titulo: 'Unidade', x: 390, largura: 90 },
        { titulo: 'Peso', x: 485, largura: 65 }
      ], criterios.map(c => [
        c.codigo,
        c.nome,
        c.tipo === 'beneficio' ? 'Benefício' : 'Custo',
        c.unidade || '-',
        `${(Number(c.peso) * 100).toFixed(1)}%`
      ]));
      doc.moveDown(0.5);
    }

    // 3. Ranking
    tituloSecao(doc, '3. Classificação Final (Ranking TOPSIS)');
    desenharTabela(doc, [
      { titulo: 'Pos', x: 45, largura: 25 },
      { titulo: 'Município / UF', x: 75, largura: 150 },
      { titulo: 'População', x: 230, largura: 65 },
      { titulo: 'IDH', x: 300, largura: 40 },
      { titulo: 'D+', x: 345, largura: 50 },
      { titulo: 'D-', x: 400, largura: 45 },
      { titulo: 'Coef. Ci', x: 450, largura: 45 },
      { titulo: 'Diagnóstico', x: 498, largura: 55 }
    ], simulacao.ranking.map((r) => {
      const faixa = classificar(r.ci);
      return [
        r.posicao,
        `${r.nome} (${r.uf})`,
        r.populacao ? Number(r.populacao).toLocaleString('pt-BR') : '-',
        r.idh ? Number(r.idh).toFixed(3) : '-',
        Number(r.distanciaPositiva).toFixed(4),
        Number(r.distanciaNegativa).toFixed(4),
        { texto: Number(r.ci).toFixed(4), cor: faixa.corTexto, negrito: true },
        { texto: faixa.abreviado, cor: faixa.corTexto }
      ];
    }));

    // 4. Alternativas excluídas
    const excluidas = simulacao.alternativasExcluidas || [];
    if (excluidas.length > 0) {
      doc.moveDown(0.5);
      tituloSecao(doc, '4. Alternativas Não Avaliadas (dados incompletos)');
      doc.fontSize(9).fillColor('#475569');
      excluidas.forEach((e) => {
        doc.text(`• ${e.nome} (${e.uf}): sem dado em ${e.criteriosSemDado.join(', ')}`, MARGEM, doc.y, { width: LARGURA });
      });
    }

    doc.moveDown(1.5);
    doc.fillColor('#94a3b8').fontSize(8).text(
      'Relatório gerado pela Plataforma de Energia Renovável com TOPSIS. Faixas: Baixa (Ci >= 0,70), Média (0,40 <= Ci < 0,70), Alta (Ci < 0,40).',
      MARGEM, doc.y, { align: 'center', width: LARGURA }
    );

    doc.end();
  });
}

module.exports = { gerarCsv, gerarPdf, textoCsv, numeroCsv };
