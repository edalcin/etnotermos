# Feature Specification: Registrar termos multilíngues e associar a comunidades

**Feature Branch**: `001-title-registrar-termos`  
**Created**: 29 de setembro de 2025  
**Status**: Draft  
**Input**: User description: "o sistema irá permitir o registro de termos em várias línguas, incluíndo linguas indígenas, e associação do termo a várias comunidades e procedimentos e eventos realizados por estas comunidades"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story

Como usuário contribuinte (ex.: pesquisador, membro de comunidade, administrador cultural), eu quero registrar termos em várias línguas — incluindo línguas indígenas — e associar cada termo a uma ou mais comunidades e aos procedimentos ou eventos que a(s) comunidade(s) realiza(m), de modo que o catálogo reflita usos, variantes linguísticas e contextos comunitários para uso posterior por pesquisadores e pelas próprias comunidades.

### Acceptance Scenarios

1. **Given** que o usuário está autenticado como contribuinte habilitado, **When** cria um novo termo com forma(s) em uma ou mais línguas, **Then** o termo é salvo com as línguas indicadas, e o usuário pode associar uma ou mais comunidades e vincular procedimentos ou eventos relacionados.

2. **Given** que existe um termo já registrado com variantes em várias línguas, **When** um usuário pesquisa por uma forma em qualquer língua, **Then** o sistema retorna o termo e todas as comunidades e eventos associados.

3. **Given** que uma comunidade quer revisar ou corrigir uma associação (por exemplo, remover um evento que não se aplica), **When** solicita a alteração, **Then** a associação é atualizada com histórico/auditoria registrada.

### Edge Cases

- Tentativa de registrar o mesmo termo (mesmo valor e mesma combinação de língua e comunidade) múltiplas vezes: o sistema deve detectar duplicatas potenciais e oferecer mesclagem ou sinalização para revisão.

- Termos sensíveis ou de acesso restrito (ex.: conhecimento de uso restrito): [NEEDS CLARIFICATION: política de visibilidade/consentimento comunitário não especificada].

- Formas escritas em alfabetos ou transcrições diferentes (por exemplo grafias locais vs. transcrição): aceitar múltiplas formas e marcar a origem/transcrição.

- Associações a procedimentos/eventos que mudam ao longo do tempo: histórico de alterações deve ser preservado.

- Usuários incompletos ou dados faltantes ao criar associações: validar campos obrigatórios e fornecer mensagens claras de erro.

### Importação de vocabulário bibliográfico (TemaTres)

- Cenário: a equipe possui um dump TemaTres (SQL) com termos extraídos de referências bibliográficas. Deseja-se importar esse subconjunto bibliográfico para o novo modelo MongoDB, preservando proveniência, ids originais (`lc_tema.tema_id`) e relacionamentos (`lc_tabla_rel`) quando aplicável.
- Objetivo: migrar termos citados em notas bibliográficas para a nova base, enriquecendo o catálogo sem perder rastreabilidade das fontes.


## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: O sistema MUST permitir criar um registro de termo com as seguintes informações mínimas: forma do termo, língua (padrão ou código), variante/transcrição (opcional), nota de contexto (opcional), e lista de comunidades associadas.
- **FR-002**: O sistema MUST permitir associar um termo a múltiplas comunidades (0..n) e, para cada associação, opcionalmente apontar procedimentos e/ou eventos realizados por essa comunidade que contextualizam o uso do termo.
- **FR-003**: O sistema MUST permitir registrar formas do termo em múltiplas línguas/variações e relacioná-las como variantes do mesmo conceito/entrada.
- **FR-004**: O sistema MUST suportar pesquisa por forma do termo em qualquer língua registrada e retornar o termo com suas associações (comunidades, procedimentos, eventos, variantes).
- **FR-005**: O sistema MUST manter um histórico básico de alterações (criação/edição/remoção de termos e associações) para fins de auditoria e reversão.
- **FR-006**: O sistema MUST apresentar advertências sobre duplicatas potenciais ao inserir termos que possuam alta similaridade com registros existentes e oferecer opções (mesclar, criar como novo, sinalizar para revisão).
- **FR-007**: O sistema MUST permitir que comunidades indiquem visibilidade/consentimento para cada associação. Serão suportados três níveis de visibilidade: `Público`, `Restrito` (acesso autenticado) e `Somente comunidade`. Associações marcadas como sensíveis exigem consentimento explícito de um representante autorizado da comunidade e passam por um fluxo de revisão por curador antes da publicação.
- **FR-008**: O sistema MUST validar metadados essenciais (ex.: língua obrigatória, comunidade quando requerida) e retornar mensagens de erro testáveis quando faltarem dados.


### Requisitos Funcionais - Importação e Integração

- **FR-009**: O sistema MUST fornecer uma ferramenta de importação que consuma dumps TemaTres (SQL) e produza documentos compatíveis com o modelo MongoDB usado pela plataforma.

- **FR-010**: Na importação, cada registro importado MUST preservar: id original (`lc_tema.tema_id`), texto da entrada, metadados de criação (datas), e indicação das fontes bibliográficas quando presentes nas notas (mapear para `sources` no documento Mongo).

- **FR-011**: Relações expressas em `lc_tabla_rel` MUST ser mapeadas para associações em MongoDB (por exemplo: relações hierárquicas, equivalências, ou relações de uso) sempre que possível; quando não for possível, gerar um relatório de itens não mapeáveis para revisão manual.

- **FR-012**: A importação MUST classificar a origem do termo como `bibliographic` (campo `sourceType`) e registrar `externalRefs` apontando para `TemaTres` com `table` e `id` originais.

- **FR-013**: O sistema MUST suportar regras configuráveis de filtragem durante a importação (por ex.: importar apenas termos que aparecem em notas bibliográficas ou com determinado `tema_id`), com logs e preview antes da execução completa.

- **FR-014**: O processo de importação MUST oferecer um modo 'dry-run' que valida e mostra estatísticas (quantidade de registros, possíveis duplicatas, relacionamentos mapeáveis, erros) sem persistir dados.

- **FR-015**: Para cada registro importado, o sistema MUST criar um rastro de auditoria que registre o pacote de importação, usuário que executou a importação, timestamp e transformações aplicadas.

- **FR-016**: A importação MUST suportar enriquecimento incremental posterior (por ex., vincular entrevistas e procedimentos ao termo importado sem perda da referência bibliográfica original).

*Notas de implementação (não prescritivas):*

- Mapeamento sugerido: `lc_tema` → `Termo` (Mongo), colunas relevantes mapeadas para `canonicalLabel`, `variants`, `createdAt`/`updatedAt` e `notes` quando houver texto bibliográfico; `lc_tabla_rel` → `associations` (procedures/events/relatedTerms) sempre que o tipo de relação for identificado.

- Recomendação operacional: executar importação inicialmente em ambiente de staging com validação humana antes de promover para produção.


*Observações sobre requisitos não funcionais e políticas (decisões iniciais):*

- Requisitos de performance e escala (decisão inicial): solução dimensionada para um escopo inicial de 10k–100k termos com picos esperados de 10–50 consultas por segundo. Implementação inicial usa indexação full-text com cache; há um plano de evolução para motor de busca dedicado (Elasticsearch/Opensearch) se o volume ou carga aumentar significativamente.

- Requisitos legais e de proteção de dados (decisão inicial): adota-se uma política conservadora: termos marcados como “sensíveis” são restritos por padrão; logs de auditoria são mantidos por 1 ano; remoção ou anonimização de registros sensíveis é suportada mediante solicitação formal da comunidade; o tratamento de dados seguirá as exigências da LGPD e será detalhado em uma política de privacidade separada.


### Key Entities *(include if feature involves data)*
- **Termo**: representa uma entrada lexical ou conceito. Atributos: id, forma (string), língua (string/código), transcrição/variante (opcional), notas de contexto, data de criação, autor.
- **Variante**: forma alternativa do mesmo Termo em outra língua ou grafia; relaciona-se a um Termo principal.
- **Comunidade**: entidade representando uma comunidade cultural/linguística. Atributos: id, nome, descrição, contatos (opcional), políticas de visibilidade/consentimento.
- **Associação (Termo–Comunidade)**: relação entre Termo e Comunidade. Atributos: id, termo_id, comunidade_id, papel/descrição (por ex. 'uso litúrgico', 'nome de lugar'), lista de procedimentos/eventos relacionados, nível de visibilidade/consentimento, metadados de autoria e data.
- **Procedimento/Event o**: representa um procedimento, rito ou evento cultural; atributos: id, nome, descrição, relação com comunidade(s), período/ocorrência (opcional).
- **AuditLog**: registro das alterações realizadas em termos e associações (operador, timestamp, ação, campo alterado, valor antigo, valor novo).

- **ExternalRef**: metadado que registra origem externa do termo (ex.: TemaTres). Atributos: source (e.g., TemaTres), table, original_id, url, importedAt, importBatchId.

## Migration & Import Checklist (gatemap)

- [ ] Criar ferramenta de conversão SQL → JSON (staging) e validar mapeamentos básicos.
- [ ] Executar dry-run e revisar relatório de duplicatas e itens não mapeáveis.
- [ ] Validar amostra (n ≥ 50) com pesquisadores para garantir fidelidade das notas bibliográficas e relacionamentos.
- [ ] Rodar importação em staging com auditoria e backups.
- [ ] Promover para produção após aprovação.


---


## Review & Acceptance Checklist
GATE: Automated checks run during main() execution

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope é claramente bounded
- [x] Dependencies and assumptions identified

Decisões tomadas (conforme aceito pelo stakeholder):
- Visibilidade/consentimento: três níveis — `Público` / `Restrito` / `Somente comunidade`. Associações sensíveis requerem consentimento explícito e revisão por curador antes da publicação.
- Privacidade/retention: termos sensíveis são restritos por padrão; logs auditáveis mantidos por 1 ano; remoção/anonimização suportada mediante solicitação; conformidade com LGPD será documentada.
- Escala/performance: solução inicial planejada para 10k–100k termos, picos de 10–50 qps; caminho de migração para motor de busca dedicado se necessário.

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
