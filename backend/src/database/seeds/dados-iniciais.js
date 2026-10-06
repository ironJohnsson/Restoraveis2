/**
 * Carga inicial da plataforma (Capítulo 7 do roteiro).
 *
 * - Critérios C1..C7 da seção 7.1, com os pesos do exemplo numérico 7.3
 *   (C6 e C7 entram com peso 0 e podem ser ativados no simulador).
 * - Municípios A, B e C do exemplo 7.3 (benchmark) e municípios da Bahia.
 *   Os indicadores dos municípios baianos são valores ILUSTRATIVOS para demonstração;
 *   substitua pelos dados oficiais (IBGE, ANEEL, INPE) via importação de CSV.
 */
const criterios = [
  { codigo: 'C1', nome: '% domicílios sem eletricidade', descricao: 'Percentual de domicílios sem acesso adequado à rede de energia elétrica', tipo: 'custo', peso: 0.20, unidade: '%', fonte: 'IBGE' },
  { codigo: 'C2', nome: 'Capacidade solar instalada', descricao: 'Capacidade instalada de geração fotovoltaica distribuída per capita', tipo: 'beneficio', peso: 0.20, unidade: 'kW/hab', fonte: 'ANEEL' },
  { codigo: 'C3', nome: 'Renda média per capita', descricao: 'Rendimento nominal mensal domiciliar per capita', tipo: 'beneficio', peso: 0.15, unidade: 'R$', fonte: 'IBGE' },
  { codigo: 'C4', nome: 'Tarifa média de energia', descricao: 'Valor médio da tarifa de energia elétrica cobrada pela concessionária local', tipo: 'custo', peso: 0.25, unidade: 'R$/kWh', fonte: 'ANEEL' },
  { codigo: 'C5', nome: 'Irradiação solar média', descricao: 'Índice de radiação solar global diária média anual', tipo: 'beneficio', peso: 0.20, unidade: 'kWh/m²/dia', fonte: 'INPE' },
  { codigo: 'C6', nome: '% extrema pobreza', descricao: 'Percentual de indivíduos com rendimento inferior à linha de pobreza extrema', tipo: 'custo', peso: 0.00, unidade: '%', fonte: 'IBGE' },
  { codigo: 'C7', nome: 'Projetos renováveis ativos', descricao: 'Número total de usinas solares, eólicas e biomassa cadastradas em operação', tipo: 'beneficio', peso: 0.00, unidade: 'unidades', fonte: 'ANEEL' }
];

// indicadores na ordem C1..C7
const municipios = [
  { nome: 'Município A (Benchmark)', uf: 'BA', populacao: 120000, idh: 0.680, latitude: -12.9714, longitude: -38.5014, indicadores: [15.0, 0.8, 980.0, 0.75, 5.2, 18.2, 3.0] },
  { nome: 'Município B (Benchmark)', uf: 'BA', populacao: 250000, idh: 0.750, latitude: -12.2568, longitude: -38.9663, indicadores: [5.0, 2.1, 1850.0, 0.62, 5.8, 8.5, 12.0] },
  { nome: 'Município C (Benchmark)', uf: 'BA', populacao: 85000, idh: 0.610, latitude: -9.4167, longitude: -40.5033, indicadores: [22.0, 0.3, 650.0, 0.89, 4.9, 28.4, 1.0] },
  { nome: 'Salvador', uf: 'BA', codigoIbge: '2927408', populacao: 2417678, idh: 0.759, latitude: -12.9777, longitude: -38.5016, indicadores: [1.8, 1.45, 1720.0, 0.78, 5.4, 12.1, 18.0] },
  { nome: 'Feira de Santana', uf: 'BA', codigoIbge: '2910800', populacao: 616272, idh: 0.712, latitude: -12.2667, longitude: -38.9667, indicadores: [3.2, 1.80, 1280.0, 0.74, 5.6, 14.5, 10.0] },
  { nome: 'Juazeiro', uf: 'BA', codigoIbge: '2918407', populacao: 235816, idh: 0.677, latitude: -9.4136, longitude: -40.5056, indicadores: [6.5, 3.10, 990.0, 0.71, 6.1, 19.8, 24.0] },
  { nome: 'Bom Jesus da Lapa', uf: 'BA', codigoIbge: '2903904', populacao: 65550, idh: 0.655, latitude: -13.2550, longitude: -43.4231, indicadores: [8.9, 4.85, 820.0, 0.69, 6.3, 22.4, 35.0] },
  { nome: 'Caetité', uf: 'BA', codigoIbge: '2905206', populacao: 52000, idh: 0.662, latitude: -14.0694, longitude: -42.4756, indicadores: [7.2, 5.20, 890.0, 0.68, 5.9, 21.0, 42.0] },
  { nome: 'Barreiras', uf: 'BA', codigoIbge: '2903201', populacao: 159743, idh: 0.721, latitude: -12.1444, longitude: -44.9969, indicadores: [4.1, 2.30, 1350.0, 0.73, 5.8, 13.9, 15.0] },
  { nome: 'Ilhéus', uf: 'BA', codigoIbge: '2913606', populacao: 178703, idh: 0.690, latitude: -14.7936, longitude: -39.0458, indicadores: [5.8, 0.95, 1100.0, 0.77, 4.8, 17.6, 6.0] },
  { nome: 'Vitória da Conquista', uf: 'BA', codigoIbge: '2933307', populacao: 370868, idh: 0.725, latitude: -14.8661, longitude: -40.8394, indicadores: [3.5, 1.65, 1320.0, 0.75, 5.3, 13.2, 11.0] },
  { nome: 'Lençóis', uf: 'BA', codigoIbge: '2919306', populacao: 11500, idh: 0.648, latitude: -12.5628, longitude: -41.3892, indicadores: [9.8, 1.10, 790.0, 0.76, 5.4, 24.5, 4.0] },
  { nome: 'Paulo Afonso', uf: 'BA', codigoIbge: '2924009', populacao: 112870, idh: 0.674, latitude: -9.4056, longitude: -38.2144, indicadores: [4.8, 2.05, 1050.0, 0.70, 5.9, 18.0, 16.0] }
];

/**
 * Contas de demonstração. A senha inicial vem de SEED_SENHA_PADRAO (padrão "123456")
 * e deve ser trocada no primeiro acesso em qualquer ambiente real.
 */
const usuarios = [
  { nome: 'Administrador do Sistema', email: 'admin@topsis.gov.br', perfil: 'admin' },
  { nome: 'Pesquisador Sênior', email: 'pesquisador@topsis.gov.br', perfil: 'pesquisador' },
  { nome: 'Gestor de Políticas Públicas', email: 'gestor@topsis.gov.br', perfil: 'gestor' }
];

module.exports = { criterios, municipios, usuarios };
