-- Migration 002 (PostgreSQL): dados geoespaciais com PostGIS.
--
-- Opcional: requer a extensão PostGIS (presente na imagem postgis/postgis do Docker Compose).
-- Em um PostgreSQL sem PostGIS a aplicação segue funcionando com latitude/longitude.
CREATE EXTENSION IF NOT EXISTS postgis;

-- `coordenadas` é derivada de latitude/longitude e mantida pelo próprio banco,
-- de modo que nunca fica dessincronizada dos campos editados pela aplicação.
ALTER TABLE municipios DROP COLUMN IF EXISTS coordenadas;
ALTER TABLE municipios
    ADD COLUMN coordenadas geometry(Point, 4326)
    GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_municipios_coordenadas ON municipios USING GIST (coordenadas);
