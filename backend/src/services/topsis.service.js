/**
 * Motor Matemático do Método TOPSIS
 * (Technique for Order Preference by Similarity to Ideal Solution)
 *
 * Implementado conforme especificação do Capítulo 7 do Roteiro Metodológico:
 * 1. Normalização Vetorial: r_ij = x_ij / sqrt(sum_k x_kj^2)
 * 2. Matriz Ponderada: v_ij = w_j * r_ij
 * 3. Solução Ideal Positiva (A+) e Negativa (A-)
 * 4. Distâncias Euclidianas (D+ e D-)
 * 5. Coeficiente de Proximidade Relativa (Ci = D- / (D+ + D-))
 * 6. Ordenação e Classificação por Ranking
 */

class TopsisService {
  /**
   * Normaliza um vetor/coluna de dados pela norma euclidiana
   * @param {number[]} coluna - Array unidimensional com valores do critério
   * @returns {number[]} - Vetor normalizado
   */
  static normalizarColuna(coluna) {
    const somaQuadrados = coluna.reduce((acc, val) => acc + (val * val), 0);
    const norma = Math.sqrt(somaQuadrados);

    if (norma === 0) {
      return coluna.map(() => 0);
    }

    return coluna.map(val => val / norma);
  }

  /**
   * Passo 1: Normalização vetorial da matriz de decisão (m alternativas x n critérios)
   * @param {number[][]} matriz - Matriz m x n
   * @returns {number[][]} - Matriz normalizada m x n
   */
  static normalizarMatriz(matriz) {
    if (!matriz || matriz.length === 0 || !matriz[0] || matriz[0].length === 0) {
      throw new Error('Matriz de decisão inválida ou vazia');
    }

    const m = matriz.length;
    const n = matriz[0].length;

    // Calcula a norma de cada coluna (critério)
    const normas = [];
    for (let j = 0; j < n; j++) {
      let somaQuad = 0;
      for (let i = 0; i < m; i++) {
        const val = Number(matriz[i][j]) || 0;
        somaQuad += val * val;
      }
      normas.push(Math.sqrt(somaQuad));
    }

    // Constrói matriz normalizada R
    const matrizNormalizada = [];
    for (let i = 0; i < m; i++) {
      const linha = [];
      for (let j = 0; j < n; j++) {
        const norma = normas[j];
        const val = Number(matriz[i][j]) || 0;
        linha.push(norma === 0 ? 0 : val / norma);
      }
      matrizNormalizada.push(linha);
    }

    return { matrizNormalizada, normas };
  }

  /**
   * Passo 2: Construção da matriz de decisão ponderada
   * v_ij = w_j * r_ij
   * @param {number[][]} matrizNormalizada 
   * @param {number[]} pesos 
   * @returns {number[][]}
   */
  static calcularMatrizPonderada(matrizNormalizada, pesos) {
    const m = matrizNormalizada.length;
    const n = matrizNormalizada[0].length;

    if (pesos.length !== n) {
      throw new Error(`Número de pesos (${pesos.length}) difere do número de critérios (${n})`);
    }

    const matrizPonderada = [];
    for (let i = 0; i < m; i++) {
      const linha = [];
      for (let j = 0; j < n; j++) {
        linha.push(matrizNormalizada[i][j] * pesos[j]);
      }
      matrizPonderada.push(linha);
    }

    return matrizPonderada;
  }

  /**
   * Passo 3 e 4: Determinar Soluções Ideais Positiva (A+) e Negativa (A-)
   * Benefício: A+ = max, A- = min
   * Custo:     A+ = min, A- = max
   * @param {number[][]} matrizPonderada 
   * @param {string[]} tipos - Array de 'beneficio' ou 'custo'
   * @returns {{ aPlus: number[], aMinus: number[] }}
   */
  static calcularSolucoesIdeais(matrizPonderada, tipos) {
    const m = matrizPonderada.length;
    const n = matrizPonderada[0].length;

    const aPlus = [];
    const aMinus = [];

    for (let j = 0; j < n; j++) {
      const valoresColuna = [];
      for (let i = 0; i < m; i++) {
        valoresColuna.push(matrizPonderada[i][j]);
      }

      const maxVal = Math.max(...valoresColuna);
      const minVal = Math.min(...valoresColuna);

      const tipo = (tipos[j] || 'beneficio').toLowerCase();

      if (tipo === 'beneficio') {
        aPlus.push(maxVal);
        aMinus.push(minVal);
      } else { // custo
        aPlus.push(minVal);
        aMinus.push(maxVal);
      }
    }

    return { aPlus, aMinus };
  }

  /**
   * Passo 5: Cálculo das distâncias Euclidianas a A+ e A-
   * D_i+ = sqrt(sum_j (v_ij - A+_j)^2)
   * D_i- = sqrt(sum_j (v_ij - A-_j)^2)
   * @param {number[][]} matrizPonderada 
   * @param {number[]} aPlus 
   * @param {number[]} aMinus 
   * @returns {{ dPlus: number[], dMinus: number[] }}
   */
  static calcularDistanciasEuclidianas(matrizPonderada, aPlus, aMinus) {
    const m = matrizPonderada.length;
    const n = matrizPonderada[0].length;

    const dPlus = [];
    const dMinus = [];

    for (let i = 0; i < m; i++) {
      let somaDistPos = 0;
      let somaDistNeg = 0;

      for (let j = 0; j < n; j++) {
        const v = matrizPonderada[i][j];
        somaDistPos += Math.pow(v - aPlus[j], 2);
        somaDistNeg += Math.pow(v - aMinus[j], 2);
      }

      dPlus.push(Math.sqrt(somaDistPos));
      dMinus.push(Math.sqrt(somaDistNeg));
    }

    return { dPlus, dMinus };
  }

  /**
   * Passo 6: Cálculo do Coeficiente de Proximidade Relativa (Ci)
   * Ci = D_i- / (D_i+ + D_i-)
   * @param {number[]} dPlus 
   * @param {number[]} dMinus 
   * @returns {number[]}
   */
  static calcularCoeficienteProximidade(dPlus, dMinus) {
    const ci = [];
    for (let i = 0; i < dPlus.length; i++) {
      const denominador = dPlus[i] + dMinus[i];
      if (denominador === 0) {
        ci.push(0.5);
      } else {
        ci.push(dMinus[i] / denominador);
      }
    }
    return ci;
  }

  /**
   * Executa o fluxo completo do algoritmo TOPSIS com metadados estruturados
   * @param {Object} params
   * @param {Array<{ id: number, nome: string, [key: string]: any }>} params.alternativas - Lista de municípios
   * @param {Array<{ id: number, codigo: string, nome: string, tipo: string }>} params.criterios - Lista de critérios
   * @param {number[]} params.pesos - Pesos dos critérios (soma = 1)
   * @param {number[][]} params.matriz - Matriz de valores brutos m x n
   * @returns {Object} - Resultados detalhados, ranking e matrizes intermediárias
   */
  static executar({ alternativas, criterios, pesos, matriz }) {
    if (!alternativas || alternativas.length === 0) {
      throw new Error('Nenhuma alternativa informada para o cálculo');
    }
    if (!criterios || criterios.length === 0) {
      throw new Error('Nenhum critério informado para o cálculo');
    }
    if (!matriz || matriz.length !== alternativas.length) {
      throw new Error('A dimensão da matriz não corresponde à quantidade de alternativas');
    }

    // Normaliza pesos se a soma for diferente de 1 (tolerância 0.001)
    const somaPesos = pesos.reduce((acc, p) => acc + (Number(p) || 0), 0);
    if (somaPesos <= 0) {
      throw new Error('A soma dos pesos deve ser maior que zero');
    }
    const pesosNormalizados = pesos.map(p => Number(p) / somaPesos);

    const tipos = criterios.map(c => c.tipo);

    // 1. Normalização
    const { matrizNormalizada, normas } = this.normalizarMatriz(matriz);

    // 2. Matriz Ponderada
    const matrizPonderada = this.calcularMatrizPonderada(matrizNormalizada, pesosNormalizados);

    // 3 e 4. Soluções Ideais
    const { aPlus, aMinus } = this.calcularSolucoesIdeais(matrizPonderada, tipos);

    // 5. Distâncias Euclidianas
    const { dPlus, dMinus } = this.calcularDistanciasEuclidianas(matrizPonderada, aPlus, aMinus);

    // 6. Coeficientes de Proximidade
    const ci = this.calcularCoeficienteProximidade(dPlus, dMinus);

    // 7. Montagem dos Resultados e Ordenação do Ranking
    const itensRanking = alternativas.map((alt, i) => {
      const ciVal = ci[i];
      // Classificação qualitativa da vulnerabilidade
      // Maior Ci = Melhor desempenho energético / Menor vulnerabilidade
      // Menor Ci = Maior vulnerabilidade social energética (prioritária para intervenção)
      let nivelVulnerabilidade;
      let corVulnerabilidade;
      if (ciVal >= 0.70) {
        nivelVulnerabilidade = 'Baixa Vulnerabilidade';
        corVulnerabilidade = '#22c55e'; // Verde
      } else if (ciVal >= 0.40) {
        nivelVulnerabilidade = 'Média Vulnerabilidade';
        corVulnerabilidade = '#eab308'; // Amarelo
      } else {
        nivelVulnerabilidade = 'Alta Vulnerabilidade';
        corVulnerabilidade = '#ef4444'; // Vermelho
      }

      return {
        municipioId: alt.id,
        nome: alt.nome,
        uf: alt.uf,
        populacao: alt.populacao,
        idh: alt.idh,
        latitude: alt.latitude,
        longitude: alt.longitude,
        ci: Number(ciVal.toFixed(6)),
        distanciaPositiva: Number(dPlus[i].toFixed(6)),
        distanciaNegativa: Number(dMinus[i].toFixed(6)),
        nivelVulnerabilidade,
        corVulnerabilidade,
        valoresOriginais: matriz[i],
        valoresNormalizados: matrizNormalizada[i].map(v => Number(v.toFixed(4))),
        valoresPonderados: matrizPonderada[i].map(v => Number(v.toFixed(4)))
      };
    });

    // Ordenação decrescente por Ci (1º lugar = maior Ci, melhor desempenho relativo)
    itensRanking.sort((a, b) => b.ci - a.ci);

    // Atribui posições no ranking
    itensRanking.forEach((item, index) => {
      item.posicao = index + 1;
    });

    return {
      totalAlternativas: alternativas.length,
      totalCriterios: criterios.length,
      pesosUtilizados: pesosNormalizados.map(p => Number(p.toFixed(4))),
      criteriosInfo: criterios.map((c, idx) => ({
        codigo: c.codigo,
        nome: c.nome,
        tipo: c.tipo,
        peso: pesosNormalizados[idx],
        norma: Number(normas[idx].toFixed(4)),
        aPlus: Number(aPlus[idx].toFixed(4)),
        aMinus: Number(aMinus[idx].toFixed(4))
      })),
      ranking: itensRanking,
      resumoEstatistico: {
        ciMaximo: Math.max(...ci),
        ciMinimo: Math.min(...ci),
        ciMedio: Number((ci.reduce((a, b) => a + b, 0) / ci.length).toFixed(4)),
        municipioMaisVulneravel: itensRanking[itensRanking.length - 1]?.nome,
        municipioMenosVulneravel: itensRanking[0]?.nome
      }
    };
  }
}

module.exports = TopsisService;
