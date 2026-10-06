# Gerenciamento Ágil do Projeto — Metodologia Scrum
## Cronograma de Sprints (16 Semanas / 8 Sprints)

---

## 1. Estrutura de Papéis Scrum
- **Product Owner (PO):** Professor orientador (Prof. Me. Celso Barreto) — responsável pela priorização do backlog de produto, validação dos critérios de aceitação e homologação das entregas.
- **Scrum Master:** Líder técnico / facilitador — responsável pela cadência das cerimônias (Sprint Planning, Daily, Review, Retrospective) e remoção de impedimentos técnicos.
- **Time de Desenvolvimento (Dev Team):** 3 a 5 desenvolvedores atuando de forma multidisciplinar (Fullstack, Engenharia de Dados/TOPSIS, UI/UX e QA).

---

## 2. Planejamento das Sprints

```mermaid
gantt
    title Cronograma de Desenvolvimento - 8 Sprints (16 Semanas)
    dateFormat  YYYY-MM-DD
    section Fase 1 - Concepção
    Sprint 1: Requisitos, Setup e Stakeholders    :done, s1, 2026-03-01, 14d
    Sprint 2: Modelagem UML e Banco de Dados       :done, s2, 2026-03-15, 14d
    section Fase 2 - Núcleo Backend
    Sprint 3: Backend CRUD e Migrations           :done, s3, 2026-03-29, 14d
    Sprint 4: Engine TOPSIS e Testes Unitários    :done, s4, 2026-04-12, 14d
    section Fase 3 - Frontend e Visualização
    Sprint 5: Frontend Dashboard e Integração API :done, s5, 2026-04-26, 14d
    Sprint 6: Mapa Georreferenciado e Relatórios  :done, s6, 2026-05-10, 14d
    section Fase 4 - Qualidade e Entrega
    Sprint 7: Testes E2E, Integração e Refinamento:done, s7, 2026-05-24, 14d
    Sprint 8: Documentação Final, Deploy e Apresentação :active, s8, 2026-06-07, 14d
```

| Sprint | Período (Semanas) | Meta e Entregáveis Principais | Critérios de Conclusão (DoD) |
|:---:|:---:|---|---|
| **Sprint 1** | Semanas 1–2 | Contextualização do problema, especificação formal de requisitos (RF/RNF), matriz de stakeholders e inicialização do repositório Git. | Documentos de requisitos e stakeholders aprovados pelo PO; Git inicializado com convenções de commit. |
| **Sprint 2** | Semanas 3–4 | Modelagem UML completa (Casos de Uso, Classes, Sequência, Atividades, Componentes, Implantação) e schema relacional. | Diagramas gerados e revisados; scripts DDL e modelos de dados aprovados. |
| **Sprint 3** | Semanas 5–6 | Backend: Estrutura da API RESTful, CRUD de municípios e critérios, migrations e seeds de dados iniciais. | Endpoints REST respondendo com status code corretos e dados persistidos. |
| **Sprint 4** | Semanas 7–8 | Engine matemático TOPSIS: normalização vetorial, soluções ideais ($A^+/A^-$), cálculo de $C_i$ e testes unitários de validação. | Testes unitários reproduzindo o exemplo 7.3 ($B > A > C$), com os valores de $C_i$ iguais aos do cálculo manual. |
| **Sprint 5** | Semanas 9–10 | Frontend: Arquitetura SPA (React + TailwindCSS), dashboard de indicadores, sliders de ponderação e integração com a API. | Dashboard funcional renderizando métricas e consumindo dados dinâmicos do backend. |
| **Sprint 6** | Semanas 11–12 | Módulo de geoprocessamento com mapa Leaflet, categorização por cores de vulnerabilidade e exportação de relatórios PDF/CSV. | Mapa interativo exibindo marcadores com popup e download de relatórios funcional. |
| **Sprint 7** | Semanas 13–14 | Testes de integração e de sistema (E2E), revisão de segurança (JWT/bcrypt e perfis de acesso), conformidade com as métricas ISO/IEC 25010 e correções. | Cobertura de testes $\ge 80\%$ exigida na integração contínua; tempo de resposta TOPSIS $< 3\text{s}$ com 500 alternativas verificado por teste. |
| **Sprint 8** | Semanas 15–16 | Empacotamento Docker Compose, integração contínua, manual do usuário final, preparação dos slides de defesa e ensaio geral da apresentação. | Docker subindo em 1 comando; documentação completa e slides aprovados. |

---

## 3. Acompanhamento

- **Cerimônias:** Sprint Planning e Review/Retrospective a cada 2 semanas; acompanhamento semanal com o Product Owner.
- **Definição de Pronto (geral):** código revisado, testes automatizados passando na integração contínua, documentação atualizada e entrega aceita pelo PO.
- As datas do cronograma acima são o planejamento de referência; ajuste-as ao calendário real da turma. A Sprint 8 permanece em andamento até a apresentação.
