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
- **Norma ISO/IEC 25010:** Metas validadas de eficiência ($< 3\text{s}$ no TOPSIS), usabilidade (interface responsiva), segurança (JWT/bcrypt) e manutenibilidade (cobertura de testes $\ge 80\%$).
- **Stack Tecnológica:**
  - *Frontend:* React 18, Vite, TailwindCSS, Leaflet (SIG)
  - *Backend:* Node.js, Express, Swagger/OpenAPI 3.0, PDFKit
  - *Banco de Dados:* SQLite / PostgreSQL + PostGIS, Docker Compose

---

## Slide 4: O Método Matemático TOPSIS
- **Passos do Algoritmo:**
  1. Construção da Matriz de Decisão $X_{m \times n}$
  2. Normalização Vetorial: $r_{ij} = x_{ij} / \sqrt{\sum x_{kj}^2}$
  3. Matriz Ponderada: $v_{ij} = w_j \cdot r_{ij}$
  4. Soluções Ideais Positiva ($A^+$) e Negativa ($A^-$)
  5. Distâncias Euclidianas: $D_i^+$ e $D_i^-$
  6. Coeficiente de Proximidade: $C_i = D_i^- / (D_i^+ + D_i^-)$
- **Validação:** Testes unitários comprovam estritamente o caso de teste da Seção 7.3 com o ranking $B > A > C$.

---

## Slide 5: Demonstração da Plataforma (Ao Vivo)
- **1. Dashboard:** Visualização dos KPIs e distribuição espacial de calor no mapa de municípios da Bahia e do Brasil.
- **2. Simulador Interativo:** Modificação em tempo real dos pesos dos critérios e execução instantânea da análise.
- **3. Análise Multidimensional:** Diagrama radar confrontando capitais e municípios do semiárido.
- **4. Geração de Relatórios:** Emissão imediata de parecer executivo em PDF e planilha analítica em CSV.

---

## Slide 6: Conclusões e Próximos Passos
- **Resultados Alcançados:**
  - 100% dos requisitos funcionais (RF01 a RF10) e não funcionais implementados;
  - 11 testes automatizados (unitários e integração) executados com 100% de sucesso;
  - Deploy em 1 comando via Docker Compose.
- **Trabalhos Futuros:**
  - Conexão em tempo real via websockets com a base aberta da ANEEL (SIGEL);
  - Expansão do algoritmo para modelos híbridos TOPSIS-AHP.
