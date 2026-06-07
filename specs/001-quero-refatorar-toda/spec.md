# Feature Specification: Refatoração EtnoTermos — SKOS-XL + Integração EtnoDB

**Feature Branch**: `001-quero-refatorar-toda`  
**Created**: 2026-06-06  
**Status**: Draft  

---

## Fundamento Filosófico

Esta especificação reconhece uma virada conceitual em relação à versão anterior do sistema:

> **O nome vernacular/tradicional é o protagonista absoluto do vocabulário.** O nome científico ocidental é um rótulo alternativo (`skosxl:altLabel`), não o inverso.

Isso implica que a interface, a modelagem de dados e o processo de curadoria devem sempre tratar o saber tradicional como ponto de referência primário, com o mapeamento para a taxonomia científica ocidental como uma "ponte" opcional e retrocompatível — e não como âncora.

O padrão **SKOS-XL** (W3C, 2009) é adotado por permitir que cada rótulo seja um **objeto de primeira classe** no banco de dados, com seus próprios metadados: origem étnica, nível de acesso, proveniência, data de validação, áudio de pronúncia. Isso é tecnicamente necessário para implementar os **Princípios CARE** por rótulo (não apenas por conceito).

---

## Contextos C4 da Aplicação

| Contexto | Porta | Finalidade | Acesso |
|----------|-------|-----------|--------|
| **Aquisição** | interno | Sincronização automática com EtnoDB | Sistema/admin |
| **Apresentação** | 4000 | Consulta e navegação somente leitura | Público |
| **Curadoria** | 4001 | Edição, enriquecimento e validação SKOS-XL | Admin/curador |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Aquisição com atribuição comunitária (Prioridade: P1)

O sistema sincroniza automaticamente os valores distintos de campos controlados da coleção `etnodb` (banco `etnodb`), criando conceitos SKOS-XL com status **"candidate"** e preservando a referência à comunidade de origem de cada valor importado.

**Por que P1**: É a única porta de entrada de termos. Sem ela, o vocabulário está vazio.

**Cenários de Aceitação**:

1. **Given** que `comunidades.plantas.nomeVernacular` contém `["cipó-mariri", "nixi pae"]` na mesma entrada, **When** a aquisição é executada, **Then** dois conceitos distintos são criados, cada um com o `sourceField: "comunidades.plantas.nomeVernacular"` e referência ao `comunidades.nome` de origem
2. **Given** que um valor em `comunidades.tipo` já existe no vocabulário como "active", **When** a aquisição é executada, **Then** o termo existente não é duplicado nem alterado
3. **Given** que novos valores aparecem em `comunidades.plantas.tipoUso`, **When** a aquisição roda, **Then** cada valor único é criado como conceito com `skosxl:prefLabel.literalForm = valor_em_lowercase` e status "candidate"
4. **Given** que a aquisição é executada, **When** conclui, **Then** um `AcquisitionLog` é gerado com: data/hora, campos processados, novos criados, já existentes, erros
5. **Given** que um campo monitorado contém valores nulos, vazios ou somente espaços, **When** a aquisição é executada, **Then** esses valores são ignorados sem erro

**Campos monitorados** (coleção `etnodb`, banco `etnodb`):

| Campo MongoDB | Grupo Semântico | Observação |
|---------------|----------------|------------|
| `comunidades.tipo` | Tipos de Comunidade Tradicional | Singular por comunidade |
| `comunidades.plantas.nomeVernacular` | Nomes Vernaculares de Plantas | Array — cada elemento vira conceito |
| `comunidades.plantas.tipoUso` | Tipos de Uso de Plantas | Array — cada elemento vira conceito |
| `comunidades.atividadesEconomicas` | Atividades Econômicas | Array — cada elemento vira conceito |

---

### User Story 2 — Apresentação e navegação de conceitos (Prioridade: P2)

Pesquisadores e o público navegam o vocabulário, buscam conceitos por rótulo, visualizam relações hierárquicas/associativas e consultam metadados SKOS-XL — incluindo apenas conteúdo com nível de acesso "público".

**Cenários de Aceitação**:

1. **Given** o usuário busca um termo parcial, **When** a busca é executada, **Then** retorna conceitos cujo `prefLabel` ou `altLabel` contenham o texto buscado (somente conceitos com accessLevel "public" ou "academic" visíveis anonimamente)
2. **Given** o usuário abre um conceito, **When** visualiza os detalhes, **Then** vê: rótulo preferido, rótulos alternativos (com idioma e povo de origem quando disponível), notas documentais, relações broader/narrower/related e grupo semântico
3. **Given** o usuário visualiza um conceito com `skos:broader`, **When** clica no conceito pai, **Then** navega para aquele conceito mantendo a trilha de navegação
4. **Given** o usuário filtra por grupo semântico (ex: "Nomes Vernaculares de Plantas"), **When** filtra, **Then** retorna apenas conceitos daquele grupo
5. **Given** um conceito tem status "deprecated", **When** o usuário o visualiza, **Then** vê o aviso de depreciação e o link para o conceito substituto
6. **Given** rótulos com `accessLevel: "sacred"` existem num conceito, **When** usuário público visualiza, **Then** esses rótulos específicos são ocultados (o conceito permanece visível com os demais rótulos públicos)

---

### User Story 3 — Curadoria e enriquecimento SKOS-XL (Prioridade: P3)

Curadores revisam conceitos "candidate", enriquecem labels com metadados SKOS-XL (atribuição étnica, áudio, nível de acesso, proveniência), estabelecem relações semânticas e promovem termos para "active" ou "deprecated".

**Cenários de Aceitação**:

1. **Given** um curador abre um conceito "candidate", **When** edita o `skosxl:prefLabel`, **Then** pode definir: `literalForm` (texto), idioma (código ISO 639-3), povo de origem, região, nível de acesso (public/restricted/sacred), fonte bibliográfica e organização validadora
2. **Given** um curador adiciona um `skosxl:altLabel` para uma língua indígena, **When** salva, **Then** o rótulo é armazenado como recurso `skosxl:Label` independente com todos os metadados preenchidos
3. **Given** um curador faz upload de áudio de pronúncia para um rótulo, **When** salva, **Then** o arquivo é associado ao `skosxl:Label` e disponível na interface de apresentação
4. **Given** um curador estabelece `skos:broader` entre dois conceitos, **When** salva, **Then** o sistema cria automaticamente o `skos:narrower` recíproco — e valida que não há ciclo (A → B → A)
5. **Given** um curador promove um conceito de "candidate" para "active", **When** confirma, **Then** o conceito torna-se visível na interface de apresentação
6. **Given** um curador depreca um conceito indicando substituto, **When** confirma, **Then** status muda para "deprecated", referência ao substituto é gravada e `skos:historyNote` é criada automaticamente
7. **Given** um curador define `accessLevel: "sacred"` para um rótulo, **When** salva, **Then** esse rótulo é omitido da interface pública; somente usuários com acesso admin visualizam
8. **Given** dois curadores editam o mesmo conceito simultaneamente, **When** o segundo tenta salvar, **Then** o sistema detecta conflito de versão e alerta sem perder nenhuma edição
9. **Given** a interface de curadoria exibe conceitos "candidate", **When** carrega a lista, **Then** destaca com indicador visual todos os termos pendentes de revisão, com quantidade por grupo semântico

---

### User Story 4 — Governança CARE e proveniência (Prioridade: P3)

Cada rótulo carrega proveniência rastreável: qual povo, qual pesquisador, qual consentimento, sob quais condições de acesso. Isso implementa os Princípios CARE por rótulo.

**Cenários de Aceitação**:

1. **Given** um curador edita um rótulo em língua indígena, **When** preenche os metadados, **Then** pode indicar: povo detentor, pesquisador coletor, referência bibliográfica ou consulta comunitária, status de consentimento prévio informado
2. **Given** um rótulo tem `accessLevel: "restricted"`, **When** exibido na interface de apresentação pública, **Then** é ocultado; quando exibido na curadoria, aparece com indicador visual de acesso restrito
3. **Given** qualquer alteração é feita via curadoria, **When** salva, **Then** um `AuditEntry` imutável é gerado com: conceito, campo, valor anterior, valor novo, responsável e data/hora

---

### Edge Cases

- O que acontece quando o mesmo valor existe em dois campos distintos (ex: "artesanato" em `tipoUso` e em `atividadesEconomicas`)? Dois conceitos separados ou um conceito com dois `sourceField`?
- Como tratar valores com acentuação inconsistente (ex: `"medicinal"` e `"medicínal"`)? A aquisição não pode detectar automaticamente.
- Deprecar conceito com filhos "active": **permitido com aviso** — filhos tornam-se órfãos temporariamente; curador resolve re-vinculação manualmente depois. O sistema DEVE exibir a lista dos conceitos que ficarão órfãos antes de confirmar.
- Falha na aquisição (MongoDB indisponível): erro gravado no `AcquisitionLog` + alerta visível no dashboard de curadoria persiste até próxima execução bem-sucedida
- Dois rótulos com mesmo `literalForm` mas idiomas diferentes: **permitido** — unicidade definida pela combinação `(literalForm + idioma + tipo)`

---

## Requirements *(mandatory)*

### Functional Requirements

**Contexto de Aquisição**

- **FR-001**: O sistema DEVE ler os valores distintos dos quatro campos controlados da coleção `etnodb` e criar conceitos SKOS-XL para cada valor ainda não existente no vocabulário
- **FR-002**: Todo conceito criado pela aquisição DEVE receber status "candidate"
- **FR-003**: O sistema DEVE registrar em cada conceito criado: `sourceFields` (array com todos os campos de origem onde o valor aparece) e `sourceCommunities` (nomes das comunidades donde veio o valor, quando aplicável). Se o mesmo valor `literalForm` já existir no vocabulário (qualquer `sourceField`), o sistema DEVE apenas adicionar o novo `sourceField` ao array existente, sem criar conceito duplicado
- **FR-004**: A normalização de capitalização DEVE converter valores para lowercase antes de deduplicar
- **FR-005**: A aquisição DEVE ser disparável manualmente via interface de curadoria e, opcionalmente, em intervalos agendados
- **FR-006**: O sistema DEVE ignorar valores nulos, vazios ou compostos exclusivamente de espaços
- **FR-007**: O sistema DEVE gerar um `AcquisitionLog` por execução: data/hora, campos processados, novos criados, já existentes, erros. Em caso de falha (MongoDB indisponível ou erro inesperado), o sistema DEVE registrar o erro no log **e** exibir alerta visível no dashboard de curadoria que persiste até a próxima execução bem-sucedida

**Contexto de Apresentação**

- **FR-008**: O sistema DEVE exibir somente conceitos com status "active" por padrão; conceitos "deprecated" são exibidos com indicação visual quando acessados diretamente
- **FR-009**: O sistema DEVE ocultar rótulos (`skosxl:Label`) com `accessLevel: "sacred"` da interface pública
- **FR-010**: O sistema DEVE permitir busca textual por `literalForm` de `prefLabel` e `altLabel` (incluindo nomes em línguas indígenas)
- **FR-011**: O sistema DEVE permitir filtro por grupo semântico (`sourceField`)
- **FR-012**: O sistema DEVE exibir relações `skos:broader`, `skos:narrower` e `skos:related` com navegação entre conceitos
- **FR-013**: O sistema DEVE exibir metadados do rótulo visíveis: idioma, povo de origem, região de origem (quando preenchidos)
- **FR-014**: A interface de apresentação DEVE ser somente leitura
- **FR-015**: A interface DEVE manter identidade visual idêntica ao EtnoDB (tema "forest", mesmos componentes, mesma tipografia)

**Contexto de Curadoria — Labels SKOS-XL**

- **FR-016**: O sistema DEVE permitir criar e editar `skosxl:prefLabel`, `skosxl:altLabel` e `skosxl:hiddenLabel` como recursos independentes (`skosxl:Label`)
- **FR-017**: Cada `skosxl:Label` DEVE suportar os seguintes metadados: `literalForm` (texto), idioma (ISO 639-3), povo de origem, região de origem, `accessLevel` (public/restricted/sacred), fonte bibliográfica (`dct:source`), organização validadora, data de validação. A unicidade de um `skosxl:Label` dentro de um conceito é definida pela combinação `(literalForm + idioma + tipo)`; o mesmo `literalForm` em idiomas diferentes é válido e representa rótulos semanticamente distintos
- **FR-018**: O sistema DEVE permitir upload de arquivo de áudio (mp3/wav) associado a um `skosxl:Label` para registrar a pronúncia correta em língua indígena. Os arquivos DEVEM ser gravados em um diretório externo configurado via variável de ambiente Docker (`AUDIO_STORAGE_PATH`); o banco de dados armazena apenas o path relativo do arquivo
- **FR-019**: O sistema DEVE suportar `skosxl:labelRelation` para declarar relações entre rótulos (ex: forma de empréstimo, cognato, variante dialetal)

**Contexto de Curadoria — Relações Semânticas**

- **FR-020**: O sistema DEVE permitir estabelecer `skos:broader`, `skos:narrower` e `skos:related` entre conceitos, garantindo reciprocidade automática
- **FR-021**: O sistema DEVE rejeitar relações que criem ciclos hierárquicos
- **FR-022**: O sistema DEVE usar o padrão **Array of Ancestors** no modelo de dados para permitir consultas hierárquicas eficientes sem recursão em tempo de execução

**Contexto de Curadoria — Notas Documentais**

- **FR-023**: O sistema DEVE permitir adicionar e editar notas: `skos:definition`, `skos:scopeNote`, `skos:historyNote`, `skos:example`

**Contexto de Curadoria — Status e Governança**

- **FR-024**: O sistema DEVE permitir transição de status: candidate → active, active → deprecated
- **FR-025**: Ao deprecar um conceito, o curador DEVE indicar o conceito substituto; o sistema DEVE registrar a referência e criar `skos:historyNote` automaticamente. Se o conceito tiver filhos com status "active", o sistema DEVE exibir lista desses filhos e um aviso de que ficarão órfãos, mas DEVE permitir prosseguir após confirmação explícita
- **FR-026**: O sistema DEVE gerar `AuditEntry` imutável para cada alteração realizada via curadoria: conceito, campo, valor anterior, novo valor, `responsável` (username do HTTP Basic Auth do curador autenticado), data/hora
- **FR-027**: O sistema DEVE exibir alerta quando um conceito estiver "órfão" (sem `skos:broader` e sem ser declarado Top Term) ou possuir `prefLabel` sem `skos:scopeNote`

**Proveniência CARE**

- **FR-028**: Cada `skosxl:Label` em língua indígena DEVE suportar registro de: povo detentor, pesquisador coletor, status de Consentimento Prévio Informado, referência bibliográfica de origem
- **FR-029**: Rótulos com `accessLevel: "sacred"` DEVEM ser completamente ocultados na interface pública; visíveis somente via curadoria

**Geral / Dados**

- **FR-030**: O vocabulário DEVE ser armazenado na coleção `etnotermos` dentro do banco de dados `etnodb`, compartilhado com o EtnoDB
- **FR-031**: O sistema NÃO DEVE permitir criação manual de conceitos via interface — todos os conceitos originam da aquisição do EtnoDB
- **FR-032**: A estrutura de dados DEVE ser compatível com exportação futura em JSON-LD / Turtle (SKOS-XL) sem migração de schema
- **FR-033**: O sistema DEVE eliminar todos os arquivos e estruturas do código legado Z39.19 que não são necessários na nova arquitetura

---

### Key Entities

- **Concept** (`skos:Concept`): Unidade semântica central. Possui IRI único, status (candidate/active/deprecated), grupo semântico (`sourceField`), ancestrais hierárquicos (array de IRIs para $graphLookup), notas documentais e relações.

- **Label** (`skosxl:Label`): Rótulo como recurso independente. Possui: `literalForm` (texto), idioma (ISO 639-3), tipo (pref/alt/hidden), povo de origem, região, `accessLevel` (public/restricted/sacred), fonte bibliográfica, organização validadora, data de validação, path de áudio de pronúncia, `skosxl:labelRelation`. **Unicidade**: combinação `(literalForm + idioma + tipo)` dentro do mesmo conceito — o mesmo texto em idiomas distintos é válido.

- **HierarchicalRelation**: Vínculo broader/narrower entre dois Concepts. Sempre recíproco. Não pode formar ciclos. O array `ancestors` de cada Concept é atualizado a cada mudança.

- **AssociativeRelation**: Vínculo `skos:related` entre dois Concepts. Sempre recíproco.

- **LabelRelation** (`skosxl:labelRelation`): Relação entre dois Labels (ex: empréstimo linguístico, cognato, variante dialetal).

- **AcquisitionLog**: Registro de cada execução da aquisição: data, campos processados, conceitos criados, já existentes, erros.

- **AuditEntry**: Registro imutável de cada alteração via curadoria: conceito, campo, valor anterior/novo, `responsável` (username do curador via HTTP Basic Auth), data/hora.

---

## Assumptions

- O MongoDB `etnodb` está em execução e acessível a ambas as aplicações na mesma rede
- O EtnoTermos é somente leitor da coleção `etnodb`; não escreve de volta nela
- A coleção `etnotermos` é criada e gerenciada exclusivamente pelo EtnoTermos
- A identidade visual segue o padrão do EtnoDB (tema "forest" do Tailwind CSS)
- Todos os commits vão para o branch `main` (conforme diretriz global)
- Registros de termos depreciados são preservados (nunca excluídos)
- A interface de apresentação é pública sem autenticação
- A interface de curadoria usa HTTP Basic Auth com múltiplos usuários nomeados (username + senha por curador); credenciais configuradas via variável de ambiente Docker
- Arquivos de áudio são gravados em filesystem externo montado via volume Docker; o caminho base é configurado pela variável de ambiente `AUDIO_STORAGE_PATH`; o banco guarda apenas o path relativo
- A exportação em JSON-LD/Turtle é fora do escopo desta fase, mas o schema deve estar preparado

---

## Dependencies

- Instância MongoDB `etnodb` com coleção `etnodb` populada pelo EtnoDB
- Acesso de leitura à coleção `etnodb` para aquisição
- Acesso de leitura/escrita à coleção `etnotermos`
- Repositório EtnoDB em `../etnoDB` como referência visual

---

## Out of Scope

- Criação manual de conceitos via interface (todos vêm do EtnoDB)
- Exportação em RDF/Turtle, JSON-LD (fase futura)
- Autenticação multi-usuário com papéis distintos (curador, admin, comunidade)
- Integração em tempo real com Reflora, Flora do Brasil, SiBBr (fase futura — arquitetura deve prever)
- Visualização gráfica interativa de rede de conceitos (Cytoscape.js — fase futura)
- Migração de dados legados Z39.19 para o novo modelo SKOS-XL
- Interface em outros idiomas além do Português

---

## Clarifications

### Session 2026-06-06

- Q: Ao deprecar conceito com filhos "active" — bloquear, permitir com aviso ou exigir re-vínculo? → A: Permitir com aviso; filhos ficam órfãos temporariamente, curador resolve depois
- Q: Armazenamento de arquivos de áudio — GridFS, filesystem Docker volume ou URL externa? → A: Filesystem externo montado via volume Docker; path configurado por variável de ambiente `AUDIO_STORAGE_PATH`
- Q: Dois Labels com mesmo `literalForm` mas idiomas diferentes no mesmo conceito — permitido ou rejeitado? → A: Permitido; unicidade é `(literalForm + idioma + tipo)`
- Q: Falha na aquisição agendada — silencioso, retry 3×, ou log + alerta visível? → A: Log no AcquisitionLog + alerta persistente no dashboard de curadoria até próxima execução bem-sucedida
- Q: Curadoria — usuário único compartilhado ou múltiplos curadores nomeados? → A: Múltiplos usuários nomeados via HTTP Basic Auth; `responsável` = username individual; credenciais por variável de ambiente Docker

---

## Review & Acceptance Checklist

### Content Quality

- [x] Fundamento filosófico documentado (vernacular como protagonista)
- [x] Focado no QUE os usuários precisam e POR QUÊ
- [x] Princípios CARE como feature de primeira classe
- [x] Todas as seções obrigatórias preenchidas

### Requirement Completeness

- [x] Nenhum marcador [NEEDS CLARIFICATION] restante
- [x] Requisitos testáveis e sem ambiguidade
- [x] Escopo claramente delimitado
- [x] Dependências e premissas identificadas
- [x] Edge case sobre mesmo valor em dois campos: conceito único com `sourceFields` array

---

## Execution Status

- [x] Documentos de referência analisados (Sobre o Banco de Dados.md, Considerações sobre o padrão.md)
- [x] Conceitos-chave extraídos
- [x] Ambiguidades marcadas
- [x] Cenários de usuário definidos (4 user stories)
- [x] Requisitos funcionais gerados (33 FRs)
- [x] Entidades identificadas (7 entidades)
- [x] Edge case sobre duplicação cross-field: conceito único com sourceFields array
