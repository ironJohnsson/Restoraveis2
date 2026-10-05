-- Migration 002 (SQLite): código IBGE dos municípios e integridade dos resultados.
--
-- Versões anteriores gravavam os filhos com id 0 (o id do registro pai era lido depois
-- de o banco ser reaberto). A limpeza abaixo remove apenas esses registros órfãos e as
-- simulações que ficaram sem nenhum resultado; em um banco novo não apaga nada.
DELETE FROM resultados_ranking WHERE simulacao_id NOT IN (SELECT id FROM simulacoes);
DELETE FROM resultados_ranking WHERE municipio_id NOT IN (SELECT id FROM municipios);
DELETE FROM matriz_decisao WHERE municipio_id NOT IN (SELECT id FROM municipios);
DELETE FROM matriz_decisao WHERE criterio_id NOT IN (SELECT id FROM criterios);
DELETE FROM simulacoes WHERE id NOT IN (SELECT DISTINCT simulacao_id FROM resultados_ranking);

ALTER TABLE municipios ADD COLUMN codigo_ibge TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uk_municipios_codigo_ibge ON municipios(codigo_ibge);
CREATE UNIQUE INDEX IF NOT EXISTS uk_resultados_simulacao_municipio ON resultados_ranking(simulacao_id, municipio_id);
