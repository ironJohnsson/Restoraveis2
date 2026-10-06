/**
 * Normaliza datas vindas do banco para ISO 8601 em UTC ("2026-10-05T15:12:09.000Z").
 * O SQLite devolve texto (CURRENT_TIMESTAMP grava "AAAA-MM-DD HH:MM:SS" em UTC, sem fuso)
 * e o PostgreSQL devolve objetos Date.
 */
function paraIso(valor) {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString();

  const textoData = String(valor);
  const semFuso = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(textoData);
  const data = new Date(semFuso ? `${textoData.replace(' ', 'T')}Z` : textoData);
  return Number.isNaN(data.getTime()) ? textoData : data.toISOString();
}

module.exports = { paraIso };
