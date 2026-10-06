/** Data/hora no fuso do navegador. A API envia sempre ISO 8601 em UTC. */
export function formatarDataHora(iso) {
  if (!iso) return '-';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '-';
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatarNumero(valor, casas) {
  if (valor === null || valor === undefined || valor === '') return '-';
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '-';
  return casas === undefined ? numero.toLocaleString('pt-BR') : numero.toFixed(casas);
}

/** Converte o texto de um campo de formulário em número; vazio vira null. Aceita vírgula decimal. */
export function numeroOuNulo(texto) {
  if (texto === null || texto === undefined || String(texto).trim() === '') return null;
  const numero = Number(String(texto).trim().replace(',', '.'));
  return Number.isFinite(numero) ? numero : NaN;
}

export const PERFIS = {
  admin: 'Administrador',
  pesquisador: 'Pesquisador',
  gestor: 'Gestor Público'
};
