-- Migração SQLite: Schema de Tabelas para a Plataforma TOPSIS
CREATE TABLE IF NOT EXISTS municipios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    uf TEXT NOT NULL,
    populacao INTEGER,
    idh REAL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nome, uf)
);

CREATE TABLE IF NOT EXISTS criterios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL CHECK(tipo IN ('beneficio', 'custo')),
    peso REAL DEFAULT 0.0,
    unidade TEXT,
    fonte TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil TEXT DEFAULT 'pesquisador',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matriz_decisao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    municipio_id INTEGER NOT NULL,
    criterio_id INTEGER NOT NULL,
    valor REAL NOT NULL,
    ano_referencia INTEGER DEFAULT 2024,
    FOREIGN KEY(municipio_id) REFERENCES municipios(id) ON DELETE CASCADE,
    FOREIGN KEY(criterio_id) REFERENCES criterios(id) ON DELETE CASCADE,
    UNIQUE(municipio_id, criterio_id, ano_referencia)
);

CREATE TABLE IF NOT EXISTS simulacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    titulo TEXT DEFAULT 'Simulação TOPSIS',
    data_execucao DATETIME DEFAULT CURRENT_TIMESTAMP,
    parametros TEXT NOT NULL,
    status TEXT DEFAULT 'concluida',
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS resultados_ranking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulacao_id INTEGER NOT NULL,
    municipio_id INTEGER NOT NULL,
    coeficiente_ci REAL NOT NULL,
    distancia_positiva REAL NOT NULL,
    distancia_negativa REAL NOT NULL,
    posicao INTEGER NOT NULL,
    FOREIGN KEY(simulacao_id) REFERENCES simulacoes(id) ON DELETE CASCADE,
    FOREIGN KEY(municipio_id) REFERENCES municipios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_municipios_uf ON municipios(uf);
CREATE INDEX IF NOT EXISTS idx_matriz_municipio ON matriz_decisao(municipio_id);
CREATE INDEX IF NOT EXISTS idx_matriz_criterio ON matriz_decisao(criterio_id);
CREATE INDEX IF NOT EXISTS idx_resultados_simulacao ON resultados_ranking(simulacao_id);
