# Análise e Mapeamento de Stakeholders
## Plataforma de Energia Renovável com TOPSIS
**Conforme boas práticas PMBOK e ISO/IEC 12207**

---

## 1. Identificação dos Interessados (Stakeholders)

| Stakeholder | Papel no Projeto | Interesse Principal | Grau de Poder | Grau de Interesse | Estratégia de Engajamento |
|---|---|---|:---:|:---:|---|
| **Gestor Público** | Usuário Primário | Identificar áreas e municípios vulneráveis para direcionamento eficaz de recursos, subsídios e políticas energéticas. | **Alto** | **Alto** | Gerenciar de perto: dashboards amigáveis, relatórios executivos prontos para impressão e mapas intuitivos. |
| **Pesquisador / Especialista** | Usuário Especialista | Analisar correlações multicritério, calibrar pesos, propor novos indicadores e validar o rigor metodológico. | **Médio** | **Alto** | Manter informado e engajado: flexibilidade para simulações, ajuste de parâmetros TOPSIS e exportação em dados brutos (CSV/JSON). |
| **Comunidade Vulnerável** | Beneficiário Final | Obter acesso universal a energia limpa, redução de custos na fatura elétrica e melhoria na qualidade de vida e desenvolvimento local. | **Baixo** | **Alto** | Manter informado e defender interesses: foco na transparência e métricas sociais justas no modelo de dados. |
| **Equipe de Desenvolvimento** | Produtor / Executor | Construir uma aplicação robusta, escalável, com código limpo, testes automatizados e arquitetura em camadas. | **Alto** | **Alto** | Operacionalização diária: sprints Scrum, revisões de código, CI/CD e integração contínua. |
| **Professor Orientador** | Validador / Sponsor Acadêmico | Garantir rigor científico, observância às normas da ABNT/ISO e conformidade com as diretrizes do curso. | **Alto** | **Alto** | Revisão quinzenal de marcos e validação de entregas por sprint. |

---

## 2. Matriz Poder x Interesse

Posicionamento conforme os graus de poder e de interesse da tabela acima (todos os envolvidos têm alto interesse no resultado):

```
      Alto Poder
          ▲
          │                              [Gestor Público]
          │                              [Professor Orientador]
          │                              [Equipe de Desenvolvimento]
          │   (Manter satisfeito)        (Gerenciar de perto)
          │ - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          │                              [Pesquisador / Especialista]   ← poder médio
          │
          │                              [Comunidade Vulnerável]
          │   (Monitorar)                (Manter informado)
          └────────────────────────────────────────────────────────►
         Baixo Interesse                                Alto Interesse
```

---

## 3. Plano de Comunicação e Feedback

1. **Revisões de Sprint (Quinzenais):** Demonstração do incremento de software funcional com avaliação do orientador e gestores convidados.
2. **Registro de Problemas e Sugestões:** Canal centralizado via repositório de código (Issues e PRs) com rastreabilidade direta aos requisitos funcionais.
3. **Métricas de Adoção:** Avaliação de facilidade de uso pelos pesquisadores através do tempo decorrido para configurar e executar a primeira simulação (< 5 minutos, meta de usabilidade da ISO/IEC 25010).
