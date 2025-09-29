# Feature Specification: Registrar termos multilíngues e associar a comunidades

**Feature Branch**: `001-title-registrar-termos`

**Created**: 29 de setembro de 2025

**Status**: Draft

**Resumo (input)**: o sistema permitirá o registro de termos em várias línguas — incluindo línguas indígenas — e a associação de cada termo a uma ou mais comunidades e aos procedimentos/eventos relevantes.

## Execution Flow

```text
1. Extrair conceitos-chave do enunciado
2. Identificar atores e cenários de uso
3. Gerar requisitos funcionais testáveis
4. Identificar entidades de dados necessárias
5. Validar checklist de revisão
6. Marcar dúvidas com [NEEDS CLARIFICATION]
```

---

## Diretrizes rápidas

- Foque no WHAT (o que o usuário precisa) e no WHY (por que importa).
- Evite HOW (detalhes de implementação como linguagens, frameworks ou arquitetura).

---

## Cenários de usuário e testes

### História principal

Como usuário contribuinte (pesquisador, membro de comunidade ou curador), quero registrar termos em várias línguas e associá-los a comunidades e procedimentos/eventos, para que o catálogo reflita usos, variantes e contextos comunitários.

### Critérios de aceitação

1. Usuário autenticado com permissão de contribuição cria um termo com uma ou mais formas/línguas; o registro é persistido e permite associar comunidades e procedimentos/eventos.

2. Pesquisa por forma (em qualquer língua registrada) retorna o termo com suas associações, variantes e metadados de proveniência.

3. Alterações solicitadas por comunidades seguem fluxo de revisão; após aprovação, o histórico é registrado no audit log.

### Casos de borda

- Duplicatas potenciais: oferecer mesclagem, criar novo ou sinalizar para revisão.
- Termos sensíveis: [NEEDS CLARIFICATION: política de visibilidade/consentimento].
- Grafias/transcrições distintas: aceitar múltiplas formas e registrar origem/transcrição.
- Associações mutáveis: preservar histórico e permitir reverter alterações.
- Dados incompletos: validar campos obrigatórios e exibir mensagens de erro claras.

---

## Requisitos

### Requisitos funcionais

- FR-001: Criar registro de Termo com: forma, código de língua, variantes/transcrições (opcional), nota de contexto (opcional) e lista de comunidades associadas.
- FR-002: Associar um Termo a múltiplas Comunidades (0..n) e, para cada associação, vincular procedimentos e/ou eventos.
- FR-003: Suportar formas do termo em múltiplas línguas e relacioná-las como variantes do mesmo conceito.
- FR-004: Pesquisar por forma em qualquer língua e retornar Termo com associações e variantes.
- FR-005: Manter histórico de criação/edição/remoção (audit log) com autor e timestamp.
- FR-006: Detectar duplicatas potenciais e oferecer opções de mesclagem/criação/sinalização.
- FR-007: Permitir que Comunidades indiquem nível de visibilidade/consentimento por associação: `Público`, `Restrito`, `Somente comunidade`.
- FR-008: Validar metadados essenciais e retornar mensagens de erro testáveis.

### Requisitos de importação e integração (TemaTres)

- FR-009: Fornecer ferramenta de importação para dumps TemaTres (SQL → JSON/MongoDB) com modo `dry-run`.
- FR-010: Preservar id original (`lc_tema.tema_id`), texto da entrada, metadados de datas e fontes bibliográficas.
- FR-011: Mapear relações de `lc_tabla_rel` para `associations`; gerar relatório de itens não mapeáveis.
- FR-012: Registrar `externalRefs` apontando para `TemaTres` com `table` e `id` originais.
- FR-013: Oferecer filtros configuráveis e preview com logs antes da importação.
- FR-014: Criar rastro de auditoria para cada pacote de importação (usuário, timestamp, transformações).
- FR-015: Suportar enriquecimento incremental mantendo referências bibliográficas originais.

---

## Entidades-chave

- Termo: id, canonicalLabel, língua, variantes, notas, createdAt, createdBy.
- Variante: forma alternativa, língua, tipo (transcrição/ortografia), origem.
- Comunidade: id, nome, descrição, contatos, políticas de visibilidade/consentimento.
- Associação: termo_id, comunidade_id, papel/descrição, procedimentos/events, nível de visibilidade, metadados de autoria e data.
- Procedimento/Event o: id, nome, descrição, relação com comunidade.
- AuditLog: usuário, timestamp, ação, campos alterados, valores antigos/novos.
- ExternalRef: source (TemaTres), table, original_id, url, importBatchId.

---

## Checklist de migração & aceitação

- [ ] Criar ferramenta de conversão SQL → JSON em ambiente de staging e validar mapeamentos.
- [ ] Rodar `dry-run` e revisar relatório de duplicatas e itens não mapeáveis.
- [ ] Validar amostra (≥ 50 registros) com especialistas/revistores comunitários.
- [ ] Executar import em staging com auditoria e backups.
- [ ] Promover para produção após revisão humana.

---

## Notas e decisões iniciais

- Visibilidade/consentimento: três níveis — `Público` / `Restrito` / `Somente comunidade`.
- Privacidade/retention: logs auditáveis mantidos por 1 ano; remoção/anonimização mediante solicitação; seguir LGPD.
- Escala inicial: 10k–100k termos; evoluir para motor de busca dedicado se necessário.

---

## Execution Status

- User description parsed
- Key concepts extracted
- Ambiguities marked
- User scenarios defined
- Requirements generated
- Entities identified
- Review checklist passed

---

Updated by spec generator.
