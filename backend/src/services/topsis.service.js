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

const { classificar } = require('../utils/classificacao');

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
   * @returns {{ matrizNormalizada: number[][], normas: number[] }}
   */
  static normalizarMatriz(matriz) {
    if (!matriz || matriz.length === 0 || !matriz[0] || matriz[0].length === 0) {
      throw new Error('Matriz de decisão inválida ou vazia');
    }

    const m = matriz.length;
    const n = matriz[0].length;

    // Valores ausentes (null) contam como 0; qualquer outro valor não numérico é erro
    const valores = matriz.map((linha, i) => {
      if (!Array.isArray(linha) || linha.length !== n) {
        throw new Error(`A linha ${i + 1} da matriz não possui ${n} critérios`);
      }
      return linha.map((celula, j) => {
        const val = celula === null || celula === undefined ? 0 : Number(celula);
        if (!Number.isFinite(val)) {
          throw new Error(`Valor não numérico na matriz de decisão (linha ${i + 1}, coluna ${j + 1})`);
        }
        return val;
      });
    });

    // Calcula a norma de cada coluna (critério)
    const normas = [];
    for (let j = 0; j < n; j++) {
      let somaQuad = 0;
      for (let i = 0; i < m; i++) {
        somaQuad += valores[i][j] * valores[i][j];
      }
      normas.push(Math.sqrt(somaQuad));
    }

    // Constrói matriz normalizada R
    const matrizNormalizada = [];
    for (let i = 0; i < m; i++) {
      const linha = [];
      for (let j = 0; j < n; j++) {
        linha.push(normas[j] === 0 ? 0 : valores[i][j] / normas[j]);
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

      const tipo = String(tipos[j] || '').toLowerCase();
      if (tipo !== 'beneficio' && tipo !== 'custo') {
        throw new Error(`Tipo de critério inválido na posição ${j + 1}: use 'beneficio' ou 'custo'`);
      }

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

    if (!Array.isArray(pesos) || pesos.length !== criterios.length) {
      throw new Error('A quantidade de pesos deve ser igual à quantidade de critérios');
    }
    const pesosNumericos = pesos.map(p => Number(p));
    if (pesosNumericos.some(p => !Number.isFinite(p) || p < 0)) {
      throw new Error('Os pesos devem ser números maiores ou iguais a zero');
    }

    // Normaliza os pesos para que somem 1 (preserva as proporções informadas)
    const somaPesos = pesosNumericos.reduce((acc, p) => acc + p, 0);
    if (somaPesos <= 0) {
      throw new Error('A soma dos pesos deve ser maior que zero');
    }
    const pesosNormalizados = pesosNumericos.map(p => p / somaPesos);

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
      // Maior Ci = melhor desempenho energético / menor vulnerabilidade
      // Menor Ci = maior vulnerabilidade social energética (prioritária para intervenção)
      const faixa = classificar(ciVal);
      const nivelVulnerabilidade = faixa.nivel;
      const corVulnerabilidade = faixa.cor;

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

    // Ordenação decrescente por Ci (1º lugar = maior Ci, melhor desempenho relativo).
    // Empates são resolvidos pelo nome para que o ranking seja sempre reproduzível.
    itensRanking.sort((a, b) => (b.ci - a.ci) || String(a.nome).localeCompare(String(b.nome), 'pt-BR'));

    // Atribui posições no ranking
    itensRanking.forEach((item, index) => {
      item.posicao = index + 1;
    });

    return {
      totalAlternativas: alternativas.length,
      totalCriterios: criterios.length,
      pesosUtilizados: pesosNormalizados.map(p => Number(p.toFixed(4))),
      criteriosInfo: criterios.map((c, idx) => ({
        id: c.id,
        codigo: c.codigo,
        nome: c.nome,
        tipo: c.tipo,
        unidade: c.unidade,
        peso: Number(pesosNormalizados[idx].toFixed(6)),
        norma: Number(normas[idx].toFixed(4)),
        aPlus: Number(aPlus[idx].toFixed(4)),
        aMinus: Number(aMinus[idx].toFixed(4))
      })),
      ranking: itensRanking,
      resumoEstatistico: {
        ciMaximo: Number(Math.max(...ci).toFixed(6)),
        ciMinimo: Number(Math.min(...ci).toFixed(6)),
        ciMedio: Number((ci.reduce((a, b) => a + b, 0) / ci.length).toFixed(4)),
        municipioMaisVulneravel: itensRanking[itensRanking.length - 1]?.nome,
        municipioMenosVulneravel: itensRanking[0]?.nome
      }
    };
  }

  /**
   * Assinatura do pseudocódigo da seção 7.2 do roteiro: recebe a matriz bruta, os pesos
   * e os tipos ('beneficio' | 'custo') e devolve [{ indice, ci }] em ordem decrescente de Ci.
   * @param {number[][]} matriz
   * @param {number[]} pesos
   * @param {string[]} tipos
   * @returns {Array<{ indice: number, ci: number }>}
   */
  static topsis(matriz, pesos, tipos) {
    const { matrizNormalizada } = this.normalizarMatriz(matriz);
    const matrizPonderada = this.calcularMatrizPonderada(matrizNormalizada, pesos);
    const { aPlus, aMinus } = this.calcularSolucoesIdeais(matrizPonderada, tipos);
    const { dPlus, dMinus } = this.calcularDistanciasEuclidianas(matrizPonderada, aPlus, aMinus);
    const ci = this.calcularCoeficienteProximidade(dPlus, dMinus);

    return ci
      .map((valor, indice) => ({ indice, ci: valor }))
      .sort((a, b) => b.ci - a.ci);
  }
}

// Atalho com o nome usado no roteiro: normalizar([3, 4]) -> [0.6, 0.8]
TopsisService.normalizar = TopsisService.normalizarColuna;

module.exports = TopsisService;
