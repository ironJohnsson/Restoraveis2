# Roteiro de Apresentação e Slides do Projeto (Pitch & Defesa)
## Plataforma de Energia Renovável com TOPSIS
**Orientação:** Prof. Me. Celso Barreto  
**Público-alvo:** Banca Examinadora / Gestores Públicos

---

## Slide 1: Título e Identificação
- **Título do Projeto:** Plataforma de Apoio à Decisão para Mensuração Multicritério de Vulnerabilidade Social Energética
- **Metodologia Central:** Algoritmo TOPSIS (*Technique for Order Preference by Similarity to Ideal Solution*)
- **Alinhamento Global:** ODS 7 da ONU — Energia Limpa e Acessível
- **Equipe:** Estudantes do Curso Técnico / Engenharia de Computação

---

## Slide 2: O Problema e a Justificativa Social
- **Contexto:** No Brasil, milhões de famílias em comunidades vulneráveis sofrem com a pobreza energética (tarifas proibitivas, falta de acesso à rede, baixa resiliência).
- **Desafio:** Como o gestor público decide de forma neutra, científica e transparente onde instalar usinas solares sociais e distribuir subsídios?
- **Solução Proposta:** Plataforma computacional com motor matemático multicritério que unifica dados socioeconômicos e climáticos em um índice único de priorização.

---

## Slide 3: Arquitetura Técnica e Conformidade ISO
- **Norma ISO/IEC 12207:** Adoção rigorosa do ciclo de vida em camadas desacopladas (Frontend SPA, Backend API RESTful, Domínio Matemático, Persistência Relacional).
- **Norma ISO/IEC 25010:** Metas verificadas por testes automatizados: eficiência ($< 3\text{s}$ com 500 alternativas), usabilidade (interface responsiva em 3 larguras de tela), segurança (JWT/bcrypt e perfis em todas as rotas) e manutenibilidade (cobertura de testes acima de 80%).
- **Stack Tecnológica:**
  - *Frontend:* React 18, Vite, TailwindCSS, Leaflet (SIG)
  - *Backend:* Node.js, Express, Swagger/OpenAPI 3.0, PDFKit
  - *Banco de Dados:* PostgreSQL + PostGIS no Docker Compose; SQLite em desenvolvimento e testes
  - *Qualidade:* Jest + Supertest, Playwright (E2E) e GitHub Actions

---

## Slide 4: O Método Matemático TOPSIS
- **Passos do Algoritmo:**
  1. Construção da Matriz de Decisão $X_{m \times n}$
  2. Normalização Vetorial: $r_{ij} = x_{ij} / \sqrt{\sum x_{kj}^2}$
  3. Matriz Ponderada: $v_{ij} = w_j \cdot r_{ij}$
  4. Soluções Ideais Positiva ($A^+$) e Negativa ($A^-$)
  5. Distâncias Euclidianas: $D_i^+$ e $D_i^-$
  6. Coeficiente de Proximidade: $C_i = D_i^- / (D_i^+ + D_i^-)$
- **Validação:** Testes unitários reproduzem o exemplo da Seção 7.3: ranking $B > A > C$ e valores de $C_i$ iguais aos do cálculo manual.

---

## Slide 5: Demonstração da Plataforma (Ao Vivo)
- **1. Login e perfis:** entrar como Administrador e mostrar que o Gestor não vê as ações de cadastro.
- **2. Cadastro com IBGE:** novo município preenchido pelo código IBGE; indicadores informados à mão ou por CSV.
- **3. Simulador:** cenário "Benchmark Roteiro (7.3)" → ranking B > A > C; depois, alterar os pesos e executar com todos os municípios.
- **4. Dashboard e mapa:** KPIs, radar comparativo, marcadores por faixa e camada de calor por indicador.
- **5. Histórico e relatórios:** reabrir uma simulação e exportar PDF e CSV.
- **Plano B:** deixar o sistema já no ar e capturas de tela prontas, caso a rede falhe (o mapa e a busca no IBGE dependem de internet).

---

## Slide 6: Conclusões e Próximos Passos
- **Resultados Alcançados:**
  - RF01 a RF10 implementados (RF09 por importação de CSV e consulta ao IBGE);
  - 214 testes de backend (unitários e de integração) e 18 testes de sistema no navegador, com cobertura acima de 80%;
  - Deploy em 1 comando via Docker Compose, com PostgreSQL + PostGIS.
- **Limitações conhecidas:**
  - os indicadores dos municípios da Bahia são ilustrativos (dados oficiais entram por importação);
  - a disponibilidade de 99,5% é uma meta operacional, ainda não medida em produção.
- **Trabalhos Futuros:**
  - Sincronização automática com os dados abertos da ANEEL e do INPE;
  - Expansão do algoritmo para modelos híbridos TOPSIS-AHP.
