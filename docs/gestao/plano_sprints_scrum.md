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
    Sprint 3: Backend CRUD e Migrations           :active, s3, 2026-03-29, 14d
    Sprint 4: Engine TOPSIS e Testes Unitários    :s4, 2026-04-12, 14d
    section Fase 3 - Frontend e Visualização
    Sprint 5: Frontend Dashboard e Integração API :s5, 2026-04-26, 14d
    Sprint 6: Mapa Georreferenciado e Relatórios  :s6, 2026-05-10, 14d
    section Fase 4 - Qualidade e Entrega
    Sprint 7: Testes E2E, Integração e Refinamento:s7, 2026-05-24, 14d
    Sprint 8: Documentação Final, Deploy e Apresentação :s8, 2026-06-07, 14d
```

| Sprint | Período (Semanas) | Meta e Entregáveis Principais | Critérios de Conclusão (DoD) |
|:---:|:---:|---|---|
| **Sprint 1** | Semanas 1–2 | Contextualização do problema, especificação formal de requisitos (RF/RNF), matriz de stakeholders e inicialização do repositório Git. | Documentos de requisitos e stakeholders aprovados pelo PO; Git inicializado com convenções de commit. |
| **Sprint 2** | Semanas 3–4 | Modelagem UML completa (Casos de Uso, Classes, Sequência, Atividades, Componentes, Implantação) e schema relacional. | Diagramas gerados e revisados; scripts DDL e modelos de dados aprovados. |
| **Sprint 3** | Semanas 5–6 | Backend: Estrutura da API RESTful, CRUD de municípios e critérios, migrations e seeds de dados iniciais. | Endpoints REST respondendo com status code corretos e dados persistidos. |
| **Sprint 4** | Semanas 7–8 | Engine matemático TOPSIS: normalização vetorial, soluções ideais ($A^+/A^-$), cálculo de $C_i$ e testes unitários de validação. | Teste matemático com caso de referência $B > A > C$ passando com 100% de precisão. |
| **Sprint 5** | Semanas 9–10 | Frontend: Arquitetura SPA (React + TailwindCSS), dashboard de indicadores, sliders de ponderação e integração com a API. | Dashboard funcional renderizando métricas e consumindo dados dinâmicos do backend. |
| **Sprint 6** | Semanas 11–12 | Módulo de geoprocessamento com mapa Leaflet, categorização por cores de vulnerabilidade e exportação de relatórios PDF/CSV. | Mapa interativo exibindo marcadores com popup e download de relatórios funcional. |
| **Sprint 7** | Semanas 13–14 | Testes integrados de ponta a ponta (E2E), auditoria de segurança (JWT/bcrypt), conformidade com métricas ISO/IEC 25010. | Cobertura de testes $\ge 80\%$, tempo de resposta TOPSIS $< 3\text{s}$ validado. |
| **Sprint 8** | Semanas 15–16 | Empacotamento Docker Compose, manual do usuário final, preparação de slides de defesa e ensaio geral da apresentação. | Docker subindo em 1 comando; documentação completa e slides aprovados. |
