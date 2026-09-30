# Manual do Usuário e Operação da Plataforma
## Plataforma de Energia Renovável com TOPSIS
**Guia Operacional para Gestores Públicos e Pesquisadores**  
**Conforme Capítulo 10 e 14 do Roteiro Metodológico**

---

## 1. Introdução e Acesso ao Sistema

A **Plataforma de Energia Renovável com TOPSIS** é uma aplicação web desenvolvida para mensurar e espacializar indicadores multicritério de vulnerabilidade social associados ao acesso e à transição energética no Brasil (ODS 7 da ONU).

### Como Iniciar a Aplicação Localmente
1. **Inicialização Rápida (Desenvolvimento):**
   - Terminal 1 (Backend):
     ```bash
     cd backend
     npm start
     ```
     *(A API responderá em `http://localhost:5000`)*
   - Terminal 2 (Frontend):
     ```bash
     cd frontend
     npm run dev
     ```
     *(A interface abrirá em `http://localhost:3000`)*

2. **Inicialização via Docker Compose (Produção / Homologação):**
   ```bash
   docker-compose up -d
   ```

### Credenciais Pré-configuradas para Testes
| Perfil de Acesso | E-mail de Login | Senha Padrão |
|---|---|:---:|
| **Administrador** | `admin@topsis.gov.br` | `123456` |
| **Pesquisador** | `pesquisador@topsis.gov.br` | `123456` |
| **Gestor Público** | `gestor@topsis.gov.br` | `123456` |

---

## 2. Guia de Operação por Funcionalidade

### 2.1 Painel Principal (Dashboard)
Ao acessar a plataforma, a tela inicial renderiza um panorama consolidado da última simulação executada:
- **Cartões de Indicadores Chave (KPIs):** Total de alternativas avaliadas, média do coeficiente $C_i$, município menos vulnerável (1º lugar) e município mais crítico (prioritário para políticas públicas).
- **Classificação em Barras:** Visualização ordenada em ordem decrescente do índice $C_i$.
- **Mapa Georreferenciado:** Plotagem cartográfica com marcadores coloridos segundo a gravidade da vulnerabilidade:
  - 🟢 **Verde (Baixa Vulnerabilidade):** $C_i \ge 0,70$
  - 🟡 **Amarelo (Média Vulnerabilidade):** $0,40 \le C_i < 0,70$
  - 🔴 **Vermelho (Alta Vulnerabilidade):** $C_i < 0,40$
- **Diagrama Radar Comparativo:** Permite confrontar o desempenho relativo entre até 4 municípios simultaneamente nos critérios C1 a C7.

---

### 2.2 Executando uma Simulação TOPSIS
1. Clique na aba **"Simulador TOPSIS"** no menu superior.
2. Na seção de configuração dos critérios:
   - Ajuste os *sliders* de ponderação de cada indicador (0% a 100%).
   - Observe a barra de verificação da soma total dos pesos.
   - Caso a soma não resulte em 100%, clique no botão **"Normalizar para 100%"**.
3. **Utilização de Cenários Rápidos:**
   - **⭐ Benchmark Roteiro (7.3):** Aplica a matriz exata do caso de teste acadêmico ($B > A > C$).
   - **☀️ Foco Solar & Renovável:** Prioriza capacidade fotovoltaica e irradiação solar.
   - **🛡️ Foco Social Crítico:** Enfatiza carência de energia e extrema pobreza.
   - **⚖️ Pesos Iguais:** Distribuição uniforme de pesos entre todos os critérios.
4. Na lista de alternativas, selecione quais municípios farão parte do cálculo.
5. Clique em **"Executar Cálculo TOPSIS"**. Em menos de 100 milissegundos, o ranking completo e os mapas serão atualizados automaticamente.

---

### 2.3 Gestão e Cadastro de Municípios
1. Navegue até a aba **"Municípios"**.
2. Clique no botão **"+ Novo Município"**.
3. Preencha os campos obrigatórios:
   - Nome do município e Sigla do Estado (UF);
   - População estimada e Índice de Desenvolvimento Humano (IDH);
   - Coordenadas geográficas (Latitude e Longitude em graus decimais);
   - Valores estimados para os indicadores C1 a C7.
4. Clique em **"Salvar Município"** para persistir as informações na base de dados.

---

### 2.4 Exportação de Relatórios Oficiais (PDF e CSV)
1. Na visualização de qualquer simulação ou na aba **"Histórico & Relatórios"**:
2. **Download em CSV:** Clique no ícone de planilha para baixar arquivo com formatação compatível com Microsoft Excel e Google Planilhas.
3. **Download em PDF:** Clique no ícone de documento para abrir ou salvar o relatório executivo diagramado, contendo síntese metodológica, parâmetros e tabela classificatória.

---

## 3. Resolução de Dúvidas Frequentes (FAQ)

- **O que significa um $C_i$ mais próximo de zero?**
  Um valor baixo de $C_i$ indica que o município está muito próximo do pior cenário possível (alta vulnerabilidade social energética, tarifas caras, carência de rede elétrica). Esse município deve ser priorizado em programas sociais.
- **Como acessar a documentação técnica da API?**
  Acesse diretamente `http://localhost:5000/api-docs` para testar os endpoints interativamente via Swagger OpenAPI.
