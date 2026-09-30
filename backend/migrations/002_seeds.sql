-- Seeds: Carga inicial de dados para a Plataforma TOPSIS
-- Critérios, Usuários, Municípios e Matriz de Decisão

-- 1. Inserção dos Critérios de Vulnerabilidade Social Energética
INSERT OR IGNORE INTO criterios (id, codigo, nome, descricao, tipo, peso, unidade, fonte) VALUES
(1, 'C1', '% domicílios sem eletricidade', 'Percentual de domicílios sem acesso adequado à rede de energia elétrica', 'custo', 0.20, '%', 'IBGE'),
(2, 'C2', 'Capacidade solar instalada', 'Capacidade instalada de geração fotovoltaica distribuída per capita', 'beneficio', 0.20, 'kW/hab', 'ANEEL'),
(3, 'C3', 'Renda média per capita', 'Rendimento nominal mensal domiciliar per capita', 'beneficio', 0.15, 'R$', 'IBGE'),
(4, 'C4', 'Tarifa média de energia', 'Valor médio da tarifa de energia elétrica cobrada pela concessionária local', 'custo', 0.25, 'R$/kWh', 'ANEEL'),
(5, 'C5', 'Irradiação solar média', 'Índice de radiação solar global diária média anual', 'beneficio', 0.20, 'kWh/m²/dia', 'INPE'),
(6, 'C6', '% extrema pobreza', 'Percentual de indivíduos com rendimento inferior à linha de pobreza extrema', 'custo', 0.00, '%', 'IBGE'),
(7, 'C7', 'Projetos renováveis ativos', 'Número total de usinas solares, eólicas e biomassa cadastradas em operação', 'beneficio', 0.00, 'unidades', 'ANEEL');

-- 2. Inserção dos Municípios (Benchmark e Cidades da Bahia)
INSERT OR IGNORE INTO municipios (id, nome, uf, populacao, idh, latitude, longitude) VALUES
(1, 'Município A (Benchmark)', 'BA', 120000, 0.680, -12.9714, -38.5014),
(2, 'Município B (Benchmark)', 'BA', 250000, 0.750, -12.2568, -38.9663),
(3, 'Município C (Benchmark)', 'BA', 85000, 0.610, -9.4167, -40.5033),
(4, 'Salvador', 'BA', 2417678, 0.759, -12.9777, -38.5016),
(5, 'Feira de Santana', 'BA', 616272, 0.712, -12.2667, -38.9667),
(6, 'Juazeiro', 'BA', 235816, 0.677, -9.4136, -40.5056),
(7, 'Bom Jesus da Lapa', 'BA', 65550, 0.655, -13.2550, -43.4231),
(8, 'Caetité', 'BA', 52000, 0.662, -14.0694, -42.4756),
(9, 'Barreiras', 'BA', 159743, 0.721, -12.1444, -44.9969),
(10, 'Ilhéus', 'BA', 178703, 0.690, -14.7936, -39.0458),
(11, 'Vitória da Conquista', 'BA', 370868, 0.725, -14.8661, -40.8394),
(12, 'Lençóis', 'BA', 11500, 0.648, -12.5628, -41.3892),
(13, 'Paulo Afonso', 'BA', 112870, 0.674, -9.4056, -38.2144);

-- 3. Matriz de Decisão (Dados para C1 a C7)
-- Benchmark Exemplo 7.3:
-- Mun A: C1=15, C2=0.8, C3=980, C4=0.75, C5=5.2
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(1, 1, 15.0, 2024), (1, 2, 0.8, 2024), (1, 3, 980.0, 2024), (1, 4, 0.75, 2024), (1, 5, 5.2, 2024), (1, 6, 18.2, 2024), (1, 7, 3.0, 2024);

-- Mun B: C1=5, C2=2.1, C3=1850, C4=0.62, C5=5.8
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(2, 1, 5.0, 2024), (2, 2, 2.1, 2024), (2, 3, 1850.0, 2024), (2, 4, 0.62, 2024), (2, 5, 5.8, 2024), (2, 6, 8.5, 2024), (2, 7, 12.0, 2024);

-- Mun C: C1=22, C2=0.3, C3=650, C4=0.89, C5=4.9
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(3, 1, 22.0, 2024), (3, 2, 0.3, 2024), (3, 3, 650.0, 2024), (3, 4, 0.89, 2024), (3, 5, 4.9, 2024), (3, 6, 28.4, 2024), (3, 7, 1.0, 2024);

-- Salvador
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(4, 1, 1.8, 2024), (4, 2, 1.45, 2024), (4, 3, 1720.0, 2024), (4, 4, 0.78, 2024), (4, 5, 5.4, 2024), (4, 6, 12.1, 2024), (4, 7, 18.0, 2024);

-- Feira de Santana
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(5, 1, 3.2, 2024), (5, 2, 1.80, 2024), (5, 3, 1280.0, 2024), (5, 4, 0.74, 2024), (5, 5, 5.6, 2024), (5, 6, 14.5, 2024), (5, 7, 10.0, 2024);

-- Juazeiro
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(6, 1, 6.5, 2024), (6, 2, 3.10, 2024), (6, 3, 990.0, 2024), (6, 4, 0.71, 2024), (6, 5, 6.1, 2024), (6, 6, 19.8, 2024), (6, 7, 24.0, 2024);

-- Bom Jesus da Lapa
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(7, 1, 8.9, 2024), (7, 2, 4.85, 2024), (7, 3, 820.0, 2024), (7, 4, 0.69, 2024), (7, 5, 6.3, 2024), (7, 6, 22.4, 2024), (7, 7, 35.0, 2024);

-- Caetité
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(8, 1, 7.2, 2024), (8, 2, 5.20, 2024), (8, 3, 890.0, 2024), (8, 4, 0.68, 2024), (8, 5, 5.9, 2024), (8, 6, 21.0, 2024), (8, 7, 42.0, 2024);

-- Barreiras
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(9, 1, 4.1, 2024), (9, 2, 2.30, 2024), (9, 3, 1350.0, 2024), (9, 4, 0.73, 2024), (9, 5, 5.8, 2024), (9, 6, 13.9, 2024), (9, 7, 15.0, 2024);

-- Ilhéus
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(10, 1, 5.8, 2024), (10, 2, 0.95, 2024), (10, 3, 1100.0, 2024), (10, 4, 0.77, 2024), (10, 5, 4.8, 2024), (10, 6, 17.6, 2024), (10, 7, 6.0, 2024);

-- Vitória da Conquista
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(11, 1, 3.5, 2024), (11, 2, 1.65, 2024), (11, 3, 1320.0, 2024), (11, 4, 0.75, 2024), (11, 5, 5.3, 2024), (11, 6, 13.2, 2024), (11, 7, 11.0, 2024);

-- Lençóis
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(12, 1, 9.8, 2024), (12, 2, 1.10, 2024), (12, 3, 790.0, 2024), (12, 4, 0.76, 2024), (12, 5, 5.4, 2024), (12, 6, 24.5, 2024), (12, 7, 4.0, 2024);

-- Paulo Afonso
INSERT OR IGNORE INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia) VALUES
(13, 1, 4.8, 2024), (13, 2, 2.05, 2024), (13, 3, 1050.0, 2024), (13, 4, 0.70, 2024), (13, 5, 5.9, 2024), (13, 6, 18.0, 2024), (13, 7, 16.0, 2024);

-- 4. Usuários Pré-configurados (senha padrão: 123456 com hash bcrypt)
INSERT OR IGNORE INTO usuarios (id, nome, email, senha_hash, perfil) VALUES
(1, 'Administrador do Sistema', 'admin@topsis.gov.br', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qHqXqK/H/V2XhI70h7p3v16l2K5Qkym', 'admin'),
(2, 'Pesquisador Sênior', 'pesquisador@topsis.gov.br', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qHqXqK/H/V2XhI70h7p3v16l2K5Qkym', 'pesquisador'),
(3, 'Gestor de Políticas Públicas', 'gestor@topsis.gov.br', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qHqXqK/H/V2XhI70h7p3v16l2K5Qkym', 'gestor');
