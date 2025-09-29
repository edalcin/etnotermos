# Feature Specification: Validar entidades taxonômicas de fauna e flora via APIs nacionais

**Feature Branch**: `002-title-validar-entidades`  
**Created**: 29 de setembro de 2025  
**Status**: Draft  
**Input**: User description: "o sistema irá validar dados de espécies da fauna e da flora nos sistemas \"Flora e Funga do Brasil\" e \"Catálogo Taxonômico da Fauna do Brasil\", usando APIs, garantindo a qualidade da representação taxonômica das entidades biológicas, quando citadas na plataforma."

 
## Execution Flow (main)

```text
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors (pesquisador, curador, sistema de validação), actions (validar, reconciliar, sinalizar), data (nomes científicos/vernaculares, autoridade, infra-especificações, região), constraints (API availability, taxa de consultas)
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
- ❌ Avoid HOW to implement (no low-level SDK details)
- 👥 Written for business stakeholders, not developers

 
 
### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature

---

## User Scenarios & Testing *(mandatory)*

 
### Primary User Story

Como pesquisador ou curador de dados, eu quero que os nomes de espécies (fauna e flora) referenciados nas observações, entrevistas e referências bibliográficas sejam validados automaticamente contra fontes oficiais nacionais ("Flora e Funga do Brasil" e "Catálogo Taxonômico da Fauna do Brasil") para garantir a qualidade e consistência taxonômica do repositório.

### Acceptance Scenarios

1. **Given** que um usuário adiciona ou edita uma entidade biológica com nome científico e/ou nome vernacular, **When** o usuário solicita validação (ou a validação é automática), **Then** o sistema consulta as APIs oficiais e retorna um status de validação: `matched`, `ambiguous`, `not_found` com sugestões e metadados (autoridade, taxonomicRank, acceptedName).

 
2. **Given** que um termo foi automaticamente reconciliado com uma entrada oficial, **When** o usuário aceita a sugestão de correspondência, **Then** o sistema grava a referência externa (`externalRefs`) com a fonte, id e timestamp, e marca a entidade como `validated` com rastro de auditoria.

3. **Given** que múltiplas correspondências plausíveis são encontradas (ex.: sinônimos ou homônimos), **When** o usuário revisa o resultado, **Then** o sistema apresenta opções com contexto (distribuição geográfica, autoridade, hierarquia) para o curador escolher ou solicitar revisão especializada.

### Edge Cases


 
## Requirements *(mandatory)*

 
### Functional Requirements

- **FR-001**: O sistema MUST permitir solicitar validação taxonômica para uma entidade biológica (ao criar/editar um registro ou por lote) usando APIs externas configuráveis.
- **FR-002**: O sistema MUST consultar as APIs oficiais (por exemplo, endpoints públicos das bases "Flora e Funga do Brasil" e "Catálogo Taxonômico da Fauna do Brasil") e interpretar respostas para produzir um resultado de validação categorizado como `matched`, `ambiguous`, `not_found`, `partial_match`.
- **FR-003**: O sistema MUST armazenar metadados da correspondência: `source` (ex.: FloraFungaBrasil), `externalId`, `matchedName`, `acceptedName`, `authority`, `taxonomicRank`, `confidenceScore`, `queriedAt`.
- **FR-004**: O sistema MUST permitir workflows manuais (curador) para resolver correspondências `ambiguous` ou `partial_match` e registrar decisões com auditoria.
- **FR-005**: O sistema MUST suportar validação em lote com paginação e relatórios resumidos (número processado, matched, ambiguous, errors).
- **FR-006**: O sistema MUST implementar política de retry/exponential backoff para chamadas a APIs externas e um modo de operação degradada (fila/async) quando as APIs estiverem indisponíveis.
- **FR-007**: O sistema MUST permitir configurar provedores de validação (adicionar/remover endpoints) e priorizá-los (por ex.: preferir FloraFunga para plantas quando disponível).
- **FR-008**: O sistema MUST manter um histórico de validações por entidade (quem validou, quando, resultados, transformações aplicadas) para auditoria e reprocessamento.
- **FR-009**: O sistema MUST expor endpoints internos para que outras partes da plataforma (ex.: importadores, UI de curadoria) acionem validação e consultem estado/resultados.

 
 
### Non-functional Requirements

- **NFR-001**: Tempo alvo para validação síncrona (quando solicitado interativamente) deve ser <= 3s em condições normais; chamadas que excedam esse limite devem cair no fluxo assíncrono com notificação ao usuário.
- **NFR-002**: O sistema MUST suportar validação em lote de até 10k registros por job com uso eficiente de paralelismo e limitação de taxa (throttling) configurável para evitar bloqueio por APIs externas.
- **NFR-003**: Logs e auditoria relacionados a consultas externas devem ser retidos por pelo menos 1 ano, como parte das políticas de rastreabilidade.

 
*Observações operacionais*: a integração depende da disponibilidade e termos de uso das APIs externas; a política de rate-limits e caches deve ser definida na configuração operacional.

 
### Key Entities *(include if feature involves data)*
- **TaxonEntity**: representa uma entidade biológica registrada no sistema. Atributos relevantes: id, vernacularNames[], scientificName, authority, taxonomicRank, validated (boolean), validationHistory[], externalRefs[].
- **ValidationResult**: resultado de uma consulta a um provedor: status (`matched`|`ambiguous`|`not_found`|`partial_match`), candidateMatches[], confidenceScore, providerMetadata, queriedAt.
- **ProviderConfig**: configuração de um provedor de validação: name, baseUrl, endpoints, authentication (if any), priority, rateLimit.
- **ValidationJob**: job assíncrono para validação em lote: id, submittedBy, submittedAt, status, stats (processed/matched/ambiguous/errors), errorReport.

 
---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (SDKs, vendor-specific code)
- [x] Focused on user value and quality of taxonomic data
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (verificações laterais possíveis)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope é claramente bounded
- [x] Dependencies and assumptions identified

 
Decisões iniciais sugeridas (para aprovação):
- Priorizar provedores nacionais oficiais e permitir fallback para serviços internacionais quando apropriado.
- Política de operação: validação interativa quando possível; operações em lote sempre em modo assíncrono com relatório.

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [ ] Review checklist passed

---
