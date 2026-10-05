/**
 * Faixas de vulnerabilidade social energética a partir do coeficiente Ci.
 * Maior Ci = mais próximo da solução ideal = menos vulnerável.
 * Fonte única das faixas para API, relatórios e (espelhada) no frontend.
 */
const LIMITE_BAIXA = 0.70;
const LIMITE_MEDIA = 0.40;

const NIVEIS = {
  baixa: { nivel: 'Baixa Vulnerabilidade', abreviado: 'Baixa Vuln.', cor: '#22c55e', corTexto: '#16a34a' },
  media: { nivel: 'Média Vulnerabilidade', abreviado: 'Média Vuln.', cor: '#eab308', corTexto: '#d97706' },
  alta: { nivel: 'Alta Vulnerabilidade', abreviado: 'Alta Vuln.', cor: '#ef4444', corTexto: '#dc2626' }
};

function classificar(ci) {
  if (ci >= LIMITE_BAIXA) return NIVEIS.baixa;
  if (ci >= LIMITE_MEDIA) return NIVEIS.media;
  return NIVEIS.alta;
}

module.exports = { LIMITE_BAIXA, LIMITE_MEDIA, NIVEIS, classificar };
