# Plano de Testes
## Plataforma de Energia Renovável com TOPSIS
**Conforme Capítulo 10 do Roteiro Metodológico**

---

## 1. Estratégia por Nível

| Nível | Ferramenta | Escopo | Onde | Quantidade |
|---|---|---|---|:---:|
| Unitário | Jest | Funções isoladas: motor TOPSIS, validação, adaptadores de banco, migrations | `backend/tests/unit/` | 58 |
| Integração | Jest + Supertest | API + banco: cada rota, regras de negócio, perfis de acesso, desempenho | `backend/tests/integration/` | 156 |
| Sistema | Playwright | Fluxos completos no navegador, com API e banco reais | `frontend/e2e/` | 18 |
| Aceitação | Manual + checklist | Critérios do cliente (seção 4) | este documento | — |

O roteiro cita o Cypress como exemplo para o nível de sistema; o projeto usa o Playwright, ferramenta equivalente.

### Como executar

```bash
cd backend && npm test                      # unitários + integração + cobertura
cd frontend && npm run test:e2e             # sistema (sobe API e interface sozinho)
```

Os testes do backend usam um banco SQLite em memória, criado a cada arquivo de teste; os E2E usam um banco temporário. **Nenhum teste toca nos dados de desenvolvimento.** A mesma suíte do backend roda contra PostgreSQL definindo `DATABASE_URL` (ver README).

---

## 2. Casos Exigidos pelo Roteiro

| Exemplo do roteiro | Teste |
|---|---|
| `topsis.normalizar()` retorna valores entre 0 e 1 | `topsis.service.test.js` — "topsis.normalizar() retorna valores entre 0 e 1" |
| Normalização vetorial preserva proporções ([3, 4] → [0,6; 0,8]) | `topsis.service.test.js` — "normalização vetorial preserva proporções" |
| Cᵢ deve estar entre 0 e 1 | `topsis.service.test.js` — "Ci deve estar entre 0 e 1" |
| `POST /api/topsis/executar` retorna 200 com ranking | `topsis.test.js` — "POST /api/topsis/executar retorna 200 com ranking" |
| Usuário cadastra município → executa TOPSIS → vê ranking | `plataforma.spec.js` — "usuário cadastra município → executa TOPSIS → vê ranking → exporta relatórios" |
| Ranking confere com cálculo manual em planilha | `topsis.service.test.js` — "exemplo 7.3 confere com o cálculo manual" + checklist de aceitação |

---

## 3. Validação Matemática do TOPSIS

Exemplo numérico 7.3 do roteiro, com pesos w = [0,20; 0,20; 0,15; 0,25; 0,20] e tipos [custo, benefício, benefício, custo, benefício]:

| Município | C1 (%) | C2 (kW) | C3 (R$) | C4 (R$) | C5 | D⁺ | D⁻ | Cᵢ | Posição |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| A | 15 | 0,8 | 980 | 0,75 | 5,2 | 0,151403 | 0,076633 | **0,336058** | 2º |
| B | 5 | 2,1 | 1850 | 0,62 | 5,8 | 0,000000 | 0,225185 | **1,000000** | 1º |
| C | 22 | 0,3 | 650 | 0,89 | 4,9 | 0,225185 | 0,000000 | **0,000000** | 3º |

Normas das colunas: 27,0924; 2,2672; 2192,1223; 1,3187; 9,2027.

B é o melhor em todos os critérios e C o pior em todos; por isso B coincide com a solução ideal positiva (Cᵢ = 1) e C com a negativa (Cᵢ = 0). **Resultado: B > A > C**, como esperado pelo roteiro.

Os valores de referência foram calculados fora da aplicação e estão fixados nos testes. Para um caso em que nenhuma alternativa domina as demais, há um segundo conjunto (4 alternativas × 3 critérios) com Cᵢ = 0,347039; 0,450713; 0,549287; 0,493513.

**Como conferir em planilha.** Para cada coluna j: norma = `RAIZ(SOMAQUAD(coluna))`; normalizado = valor / norma; ponderado = normalizado × peso. A⁺ é o máximo da coluna ponderada nos critérios de benefício e o mínimo nos de custo (A⁻ é o inverso). D⁺ = `RAIZ(SOMAXMY2(linha; A⁺))`, D⁻ = `RAIZ(SOMAXMY2(linha; A⁻))` e Cᵢ = D⁻ / (D⁺ + D⁻).

---

## 4. Checklist de Aceitação (manual)

Executar com o sistema no ar (`docker compose up -d --build`), antes de cada entrega.

| # | Verificação | Resultado esperado | OK |
|:---:|---|---|:---:|
| 1 | Subir o sistema com 1 comando | Interface em `localhost:3000`, Swagger em `localhost:5000/api-docs` | ☐ |
| 2 | Tentar entrar com senha errada | Mensagem "Credenciais inválidas" | ☐ |
| 3 | Entrar como Administrador e cadastrar um município usando "Preencher com dados do IBGE" | Nome, UF, população e coordenadas preenchidos; município aparece na tabela | ☐ |
| 4 | Simulador → cenário "Benchmark Roteiro (7.3)" → Executar | Ranking B, A, C com Cᵢ 1,0000; 0,3361; 0,0000 | ☐ |
| 5 | Conferir o item 4 com a planilha da seção 3 | Mesmos valores | ☐ |
| 6 | Executar com todos os municípios e pesos padrão | Dashboard com KPIs, barras, mapa e radar | ☐ |
| 7 | Mapa → "Mapa de calor" → escolher um indicador | Camada de calor exibida e legenda atualizada | ☐ |
| 8 | Histórico → baixar CSV e PDF da última simulação | Arquivos abrem no Excel e no leitor de PDF, com todos os municípios | ☐ |
| 9 | Critérios → alterar um peso sem ajustar os demais | "Salvar pesos" desabilitado enquanto a soma não for 1,0 | ☐ |
| 10 | Entrar como Gestor Público | Sem aba "Usuários" e sem botões de cadastro/exclusão | ☐ |
| 11 | Abrir o sistema em celular (ou largura de 375 px) | Telas utilizáveis, sem rolagem horizontal | ☐ |
| 12 | Repetir os itens 4 e 6 no Firefox e no Safari | Mesmo comportamento | ☐ |
| 13 | Usabilidade: pedir a uma pessoa que nunca usou o sistema que execute uma simulação | Concluída em menos de 5 minutos, sem ajuda | ☐ |

---

## 5. Cobertura

Medida pelo Jest a cada execução de `npm test` (relatório em `backend/coverage/`). Limite mínimo de 80% para instruções, ramos, funções e linhas, configurado em `backend/package.json`: abaixo disso, o comando e a integração contínua falham.

| Métrica | Medido | Mínimo |
|---|:---:|:---:|
| Instruções | 98,9% | 80% |
| Ramos | 90,8% | 80% |
| Funções | 98,3% | 80% |
| Linhas | 99,5% | 80% |

---

## 6. Integração Contínua

`.github/workflows/ci.yml` executa a cada push e pull request:

1. **backend** — testes unitários e de integração com cobertura (SQLite);
2. **backend-postgres** — a mesma suíte em PostgreSQL + PostGIS e a verificação da coluna geoespacial;
3. **frontend** — build de produção;
4. **e2e** — testes de sistema no navegador;
5. **docker** — `docker compose up` completo, com chamadas à interface, à API e ao login.
