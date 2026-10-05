/**
 * Faixas de vulnerabilidade a partir do coeficiente Ci (espelham
 * backend/src/utils/classificacao.js). Maior Ci = menos vulnerável.
 */
export const LIMITE_BAIXA = 0.70;
export const LIMITE_MEDIA = 0.40;

const FAIXAS = {
  baixa: {
    id: 'baixa',
    nivel: 'Baixa Vulnerabilidade',
    cor: '#22c55e',
    barra: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  media: {
    id: 'media',
    nivel: 'Média Vulnerabilidade',
    cor: '#eab308',
    barra: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  alta: {
    id: 'alta',
    nivel: 'Alta Vulnerabilidade',
    cor: '#ef4444',
    barra: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200'
  }
};

export function classificar(ci) {
  if (ci >= LIMITE_BAIXA) return FAIXAS.baixa;
  if (ci >= LIMITE_MEDIA) return FAIXAS.media;
  return FAIXAS.alta;
}
