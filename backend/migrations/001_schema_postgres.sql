-- Migração 001: Schema PostgreSQL + PostGIS
-- Criação das tabelas centrais da Plataforma de Energia Renovável com TOPSIS

-- Habilita extensão PostGIS para dados geoespaciais
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Tabela de Municípios / Comunidades
CREATE TABLE IF NOT EXISTS municipios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    uf CHAR(2) NOT NULL,
    populacao INTEGER,
    idh DECIMAL(4,3),
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    coordenadas GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_municipio_uf UNIQUE (nome, uf)
);

-- 2. Tabela de Critérios de Vulnerabilidade Social Energética
CREATE TABLE IF NOT EXISTS criterios (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('beneficio', 'custo')),
    peso DECIMAL(5,4) DEFAULT 0.0 CHECK (peso >= 0 AND peso <= 1),
    unidade VARCHAR(50),
    fonte VARCHAR(100)
);

-- 3. Tabela de Usuários e Perfis de Acesso
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) DEFAULT 'pesquisador' CHECK (perfil IN ('admin', 'pesquisador', 'gestor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Matriz de Decisão Multicritério
CREATE TABLE IF NOT EXISTS matriz_decisao (
    id SERIAL PRIMARY KEY,
    municipio_id INTEGER NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    criterio_id INTEGER NOT NULL REFERENCES criterios(id) ON DELETE CASCADE,
    valor DECIMAL(15,4) NOT NULL,
    ano_referencia INTEGER DEFAULT 2024,
    CONSTRAINT uk_matriz_mun_crit_ano UNIQUE (municipio_id, criterio_id, ano_referencia)
);

-- 5. Histórico de Simulações TOPSIS
CREATE TABLE IF NOT EXISTS simulacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    titulo VARCHAR(200) DEFAULT 'Simulação TOPSIS',
    data_execucao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parametros JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'concluida'
);

-- 6. Resultados de Ranking das Simulações
CREATE TABLE IF NOT EXISTS resultados_ranking (
    id SERIAL PRIMARY KEY,
    simulacao_id INTEGER NOT NULL REFERENCES simulacoes(id) ON DELETE CASCADE,
    municipio_id INTEGER NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    coeficiente_ci DECIMAL(10,8) NOT NULL,
    distancia_positiva DECIMAL(10,8) NOT NULL,
    distancia_negativa DECIMAL(10,8) NOT NULL,
    posicao INTEGER NOT NULL,
    CONSTRAINT uk_simulacao_posicao UNIQUE (simulacao_id, posicao)
);

-- Índices de desempenho
CREATE INDEX IF NOT EXISTS idx_municipios_uf ON municipios(uf);
CREATE INDEX IF NOT EXISTS idx_matriz_municipio ON matriz_decisao(municipio_id);
CREATE INDEX IF NOT EXISTS idx_matriz_criterio ON matriz_decisao(criterio_id);
CREATE INDEX IF NOT EXISTS idx_resultados_simulacao ON resultados_ranking(simulacao_id);
