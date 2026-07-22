# BioCultTermos — Plataforma de Curadoria de Vocabulário Controlado Etnobotânico
## Versão 2.0

<div align="center">
  <img src="docs/BioCultTermosLogo.png" alt="BioCultTermos Logo" width="200">
</div>

**BioCultTermos v2.0** é o **módulo de vocabulário controlado etnobotânico** da [Arquitetura BioCultural](https://github.com/edalcin/Arquitetura-BioCultural), embutido via **git submodule** em cada unidade federada (BioCultDB, BioCultRelatos, BioCultAcervos, BioCultNaturalistas), operando sob o padrão **SKOS-XL** (Simple Knowledge Organization System — eXtension for Labels).

> **Padrão**: [W3C SKOS-XL](https://www.w3.org/TR/skos-reference/skos-xl.html) · [Especificação SKOS completa](docs/simple_knowledge_organization_system_skos.pdf)

> "Se os dados não estão fisicamente sob o controle de quem os gerou, a soberania é apenas uma promessa bonita em um termo de consentimento."
>
> — Eduardo Dalcin, em [*Sementes Livres, Solos Próprios: Por que o Conhecimento Tradicional exige uma Arquitetura Federada*](https://eduardo.dalc.in/por-que-o-conhecimento-tradicional-exige-uma-arquitetura-federada/), post que resume e ilustra didaticamente a arquitetura federada na qual cada membro opera sua própria instância soberana do BioCultTermos.

---

## Motivação

O conhecimento das comunidades tradicionais do Brasil expressa relações profundas entre povos, línguas e entidades biológicas. Preservar esse conhecimento de forma legítima exige uma arquitetura de informação que não seja colonizadora — que trate os termos das línguas indígenas como protagonistas, não como apêndices subordinados à nomenclatura científica ocidental.

O BioCultTermos nasce desta necessidade: gerenciar os termos que a ferramenta principal de cada unidade federada acumula (literatura científica no caso do BioCultDB; registro primário no BioCultRelatos; acervos e obras históricas em BioCultAcervos/BioCultNaturalistas), submetendo-os a um processo estruturado de curadoria segundo o padrão SKOS-XL, com governança de dados alinhada aos Princípios CARE.

---

## Por que SKOS-XL (e não ANSI/NISO Z39.19)

A versão 1.0 seguia o padrão ANSI/NISO Z39.19-2005, concebido para vocabulários monolíngues. Para o conhecimento tradicional associado à biodiversidade, esse padrão apresenta limitações estruturais críticas:

### Rótulos como objetos de primeira classe

No SKOS padrão (e no Z39.19), rótulos são literais de texto simples:

```turtle
skos:prefLabel "Ayahuasca"@pt
skos:altLabel  "Nixi Pae"@hux
```

Não é possível anotar esses rótulos. Não dá para registrar *de qual povo vem "Nixi Pae"*, *qual a ortografia validada*, ou *qual o nível de acesso* a esse conhecimento.

O **SKOS-XL** resolve isso transformando cada rótulo em um recurso RDF próprio:

```turtle
ex:label_nixi_pae a skosxl:Label ;
    skosxl:literalForm "Nixi Pae"@hux ;
    ex:sourcePeople    "Huni Kuĩ (Kaxinawá)" ;
    ex:sourceRegion    "Alto Juruá, Acre" ;
    ex:accessLevel     "public" ;
    ex:audioPath       "/audio/nixi-pae-huni-kui.mp3" ;
    ex:validatedBy     "ASKARJ" .
```

### Multiplicidade linguística real

Termos como *ayahuasca*, *cipó-mariri*, *nixi pae*, *daime* e *hoasca* são rótulos do **mesmo conceito**, mas cada um carrega origem étnica, língua e contexto cerimonial distintos. Com SKOS-XL, cada rótulo recebe atribuição própria — o que era impossível com literais simples.

### Controle de acesso por rótulo (Princípios CARE)

O SKOS-XL permite definir `accessLevel` individualmente por rótulo:

- **`public`** — aberto para consulta na internet
- **`restricted`** — visível apenas a pesquisadores autorizados (SisGen/comunidade)
- **`sacred`** — visível apenas aos membros da comunidade detentora

Isso implementa diretamente o princípio **Authority to Control** do CARE: a comunidade decide qual denominação do seu conhecimento pode ser divulgada e em que nível.

### Relações entre rótulos (labelRelation)

`skosxl:labelRelation` permite modelar relações etimológicas e de origem entre denominações:

```turtle
ex:label_jurema_pt skosxl:labelRelation ex:label_jurema_kariri .
# O rótulo em Tupí/Kariri é a forma de origem; o português é empréstimo.
```

### Interoperabilidade Darwin Core e JSON-LD

`dwc:vernacularName` pode ser mapeado para `skosxl:Label`, permitindo que nomes vernáculos tenham a riqueza de anotação do XL e sejam consumidos por GBIF, WFO e outras infraestruturas de biodiversidade via JSON-LD.

---

## Por que SQLite+JSON

O SQLite com JSON1 é a escolha técnica mais adequada para a natureza plural e dinâmica deste domínio, com a vantagem adicional de ser um arquivo único, portável e sem servidor — reforçando a soberania de cada instância:

### Pluralismo taxonômico

Em vez de tabelas rígidas, um único documento JSON (coluna `doc`) pode conter simultaneamente a classificação ocidental e múltiplas etnotaxonomias, sem que um esquema interfira no outro.

### Modelagem dinâmica de línguas indígenas

O modelo de documento JSON (JSON1) permite que atributos variem entre registros. Línguas com arquivos de áudio, notas rituais ou variações ortográficas coexistem com registros mais simples — sem penalidade de esquema.

### Compatibilidade com JSON-LD

O SQLite armazena o documento inteiro como texto JSON na coluna `doc`, permitindo guardar e consultar estruturas JSON-LD diretamente (`json_extract`, `json_each`) — facilitando a interoperabilidade com padrões de Web Semântica.

### Hierarquias com Array of Ancestors

Para representar hierarquias de etnotaxonomias, o padrão *Array of Ancestors* armazena toda a cadeia de ancestrais no documento. Isso permite descobrir a linha hierárquica completa de um conceito com uma única consulta (`json_each(doc, '$.ancestors')`), sem recursividade custosa em tempo de execução.

```json
{
  "uri": "etnotermos:plantas-medicinais/jatoba",
  "prefLabels": [{ "literalForm": "jatobá", "language": "pt", "accessLevel": "public" }],
  "broader": ["<id-plantas-medicinais>"],
  "ancestors": ["<id-plantas-medicinais>", "<id-usos-tradicionais>"]
}
```

### FTS5 e json_each para travessias complexas

O SQLite compila com o módulo **FTS5**, usado para busca textual ponderada (`bm25()`) sobre `prefLabels`/`altLabels`/`definition`/`scopeNote` — a alternativa nativa do SQLite para busca full-text ponderada. Travessias em grafos de relacionamentos — útil para consultas como *"todos os conceitos relacionados ao uso medicinal que possuem rótulo em língua indígena"* — são feitas com `json_each` sobre os arrays `related`/`broader`/`narrower` em CTEs, sem necessidade de um operador proprietário de travessia de grafos.

---

## Módulo Compartilhado via Git Submodule

O BioCultTermos é **um único repositório**, consumido como **git submodule** por cada unidade hospedeira — nunca um fork por unidade. Alterações de código são sempre commitadas de dentro do submodule de alguma unidade (ex.: `BioCultDB/bioculttermos/`), pushadas de volta a este mesmo repositório compartilhado, e então propagadas às demais unidades via bump do ponteiro do submodule quando cada uma decide incorporar a mudança.

**Toda mudança de código feita através de qualquer unidade hospedeira é documentada em
[`CHANGELOG.md`](CHANGELOG.md)** deste repositório — ver
[ADR-010](https://github.com/edalcin/Arquitetura-BioCultural/blob/main/docs/architecture-decisions/ADR-010-central-documentation-and-build-verification.md)
da Arquitetura BioCultural.

**Este repositório está congelado como produto standalone** desde a integração com o BioCultDB (julho de 2026, ver ADR-001 abaixo): ninguém sobe seu `docker-compose.yml` isoladamente em produção, e ele não recebe roadmap próprio. Toda evolução acontece através das unidades hospedeiras:

| Unidade hospedeira | Ferramenta principal | Status da integração |
|---|---|---|
| Iniciativa de Fontes Secundárias | [BioCultDB](https://github.com/edalcin/BioCultDB) | **Implementado, em produção** desde 2026-07-13 — `BioCultDB/integracao.md`, `BioCultDB/docs/decisions/ADR-001-integracao-bioculttermos.md` |
| Comunidade Tradicional | [BioCultRelatos](https://github.com/edalcin/BioCultRelatos) | Padrão definido, implementação pendente (repositório ainda sem código) — `BioCultRelatos/integracao.md`, `BioCultRelatos/docs/decisions/ADR-001-integracao-bioculttermos.md` |
| Acervos Históricos e Museológicos | [BioCultAcervos](https://github.com/edalcin/BioCultAcervos) | Padrão definido, implementação pendente (repositório ainda sem código) — `BioCultAcervos/integracao.md`, `BioCultAcervos/docs/decisions/ADR-001-integracao-bioculttermos.md` |
| Obras de Naturalistas (séc. XVII–XIX) | [BioCultNaturalistas](https://github.com/edalcin/BioCultNaturalistas) | Padrão definido, implementação pendente (repositório ainda sem código) — `BioCultNaturalistas/integracao.md`, `BioCultNaturalistas/docs/decisions/ADR-001-integracao-bioculttermos.md` |

**Soberania é de dados, não de código.** O módulo BioCultTermos é intencionalmente o mesmo binário/código em todas as unidades — o que cada unidade mantém soberano é seu próprio arquivo SQLite (`ConceptScheme` próprio, dados nunca compartilhados entre unidades). Decisão arquitetural completa em [ADR-007 da Arquitetura BioCultural](https://github.com/edalcin/Arquitetura-BioCultural/blob/main/docs/architecture-decisions/ADR-007-shared-bioculttermos-module.md).

**Bloqueio de código pendente**: o `AcquisitionService` (`backend/src/services/AcquisitionService.js`) ainda lê a tabela `biocultdb_records` com uma lista de campos hardcoded — funciona hoje apenas para o BioCultDB. Generalizar tabela-fonte e campos monitorados como configuráveis é pré-requisito bloqueante para qualquer unidade além do BioCultDB entrar em produção (ver ADR-001 de cada unidade hospedeira acima).

## Integração de Referência — BioCultDB (produção)

O BioCultTermos entra como **git submodule** dentro do repositório do
[BioCultDB](https://github.com/edalcin/BioCultDB) e roda no **mesmo container Docker** que ele
(imagem dual-app `docker/Dockerfile.unidade`, publicada como `ghcr.io/edalcin/biocultdb:latest`) —
não é um sistema externo, é a mesma unidade de implantação (**Unidade de Fontes Secundárias**,
ADR-005 da Arquitetura BioCultural). Esta é a única integração em produção até o momento; serve de
modelo de implementação real para as demais unidades da tabela acima. Os dois processos compartilham
banco de dados, identidade visual e vocabulário:

| Aspecto | Detalhe |
|---|---|
| **Database** | SQLite `biocultdb.sqlite` (arquivo compartilhado, WAL) — nome específico do BioCultDB por continuidade de dado real; demais unidades usam o nome canônico `unidade.sqlite` (ADR-005) |
| **Tabela etnotermos** | `etnotermos` (separada de `biocultdb_records`) |
| **Tabela fonte** | `biocultdb_records` (lida pelo contexto de Aquisição) |
| **Campos gerenciados** | `comunidades.tipo`, `comunidades.plantas.nomeCientifico`, `comunidades.plantas.nomeVernacular`, `comunidades.plantas.tipoUso`, `comunidades.atividadesEconomicas` — mais um vocabulário estático de referência de tipos de uso (`src/data/referenceTerms.js`, ~450 termos do domínio etnobotânico), semeado a cada ciclo de aquisição independente do que já foi digitado em algum registro |
| **Identidade visual** | Tema `forest` (Tailwind CSS) — mesmas cores, fontes, componentes |

O BioCultDB coleta dados secundários de artigos científicos. O BioCultTermos consome esses dados automaticamente via contexto de Aquisição, transformando valores brutos em conceitos SKOS-XL candidatos. Os curadores então elevam, relacionam e enriquecem esses conceitos via interface de Curadoria.

**Em produção desde julho de 2026** — detalhes da integração, corte e estabilização em
`BioCultDB/integracao.md` e `BioCultDB/docs/decisions/ADR-001-integracao-bioculttermos.md`.

---

## Arquitetura — C4 Model

### Nível 1 — Contexto do Sistema

```mermaid
graph TD
    U1["🔍 Público / Pesquisador\n(acesso anônimo)"]
    U2["✏️ Curador\n(autenticado)"]
    ET["BioCultTermos v2.0\n[Sistema]\nAquisição · Apresentação · Curadoria\nde vocabulário controlado SKOS-XL"]
    EDB["BioCultDB\n[Mesmo container]\nBase de dados etnobotânicos\nportas 3001–3003"]
    SDB[("SQLite+JSON\n[Banco de Dados]\nbiocultdb.sqlite")]

    U1 -->|"Consulta termos\n(porta 4000)"| ET
    U2 -->|"Cura e valida termos\n(porta 4001)"| ET
    ET -->|"Lê vocabulário bruto\n(tabela biocultdb_records)"| SDB
    ET -->|"Persiste conceitos SKOS-XL\n(tabela etnotermos)"| SDB
    EDB -->|"Escreve registros\n(tabela biocultdb_records)"| SDB

    style ET fill:#16a34a,color:#fff
    style EDB fill:#0369a1,color:#fff
    style SDB fill:#4d7c0f,color:#fff
```

### Nível 2 — Containers

```mermaid
graph TD
    subgraph BioCultTermos["BioCultTermos v2.0"]
        direction TB
        PUB["Interface Pública\n[Express.js + EJS]\nPorta 4000\nLeitura apenas, sem auth"]
        ADM["Interface Admin\n[Express.js + EJS]\nPorta 4001\nAuth bcrypt, curadoria CRUD"]
    end

    subgraph Shared["Banco Compartilhado"]
        SDB[("SQLite biocultdb.sqlite\n[Banco de Dados]\ntabelas: etnotermos\netnotermos_acquisition_log\netnotermos_audit_log")]
    end

    subgraph BioCultDB["BioCultDB (mesmo container, Unidade de Fontes Secundárias)"]
        EDBAPP["Aplicação BioCultDB\nPortas 3001–3003"]
        EDBTBL[("tabela biocultdb_records")]
    end

    PUB -->|"findMany, findById\n(somente active)"| SDB
    ADM -->|"CRUD completo + audit"| SDB
    ADM -->|"Aquisição periódica\n(cron + on-demand)"| EDBTBL
    EDBAPP --> EDBTBL

    style PUB fill:#dcfce7,color:#166534
    style ADM fill:#fef9c3,color:#854d0e
    style SDB fill:#4d7c0f,color:#fff
    style EDBTBL fill:#1d4ed8,color:#fff
```

### Nível 3 — Componentes

#### Contexto de Aquisição (dentro do Admin)

```mermaid
graph LR
    CRON["Cron Scheduler\n[node-cron]\nexecução periódica"]
    ROUTE["POST /acquisition/run\n[Express Route]"]
    SVC["AcquisitionService\n[Serviço]\nnormalização + dedup"]
    ETNTBL[("tabela biocultdb_records\n(fonte)")]
    TERMTBL[("tabela etnotermos\n(destino)")]
    LOGTBL[("etnotermos_acquisition_log")]

    CRON --> SVC
    ROUTE --> SVC
    SVC -->|"lower() + trim"| ETNTBL
    SVC -->|"upsert por literalForm"| TERMTBL
    SVC -->|"log success/failure"| LOGTBL
```

#### Contexto de Apresentação (porta 4000)

```mermaid
graph LR
    REQ["GET /\nGET /:id\n[Express Routes]"]
    CS["ConceptService\n[Serviço]\nfindMany, findById"]
    SS["SearchService\n[Serviço]\nbusca por texto"]
    COL[("tabela etnotermos\n(somente active)")]
    FILTER["Filtro accessLevel\n(omite sacred/restricted)"]

    REQ --> CS
    REQ --> SS
    CS --> FILTER
    SS --> FILTER
    FILTER --> COL
```

#### Contexto de Curadoria (porta 4001)

```mermaid
graph LR
    ROUTES["Routes Admin\n[Express]\n/concepts /acquisition /audit"]
    CS["ConceptService\n[Serviço]\nCRUD + otimistic locking"]
    AS["AuditService\n[Serviço]\nregistro por campo"]
    ACQS["AcquisitionService\n[Serviço]\nrun + status"]
    VALID["SKOS-XL Validation\n[Lib]\nuniqueness, cycle, prefLabel"]
    COL[("tabela etnotermos")]
    AUDIT[("etnotermos_audit_log")]

    ROUTES --> CS
    ROUTES --> AS
    ROUTES --> ACQS
    CS --> VALID
    CS --> COL
    CS -->|"version field\n(optimistic lock)"| COL
    AS --> AUDIT
```

---

## Modelo de Conceito SKOS-XL

```json
{
  "id": "<uuid>",
  "uri": "etnotermos:tipo-comunidade/indigena",
  "status": "candidate | active | deprecated",
  "sourceFields": ["comunidades.tipo"],
  "prefLabels": [
    {
      "id": "<uuid>",
      "literalForm": "indígena",
      "language": "pt",
      "type": "pref",
      "accessLevel": "public | restricted | sacred",
      "audioPath": null,
      "labelRelations": [],
      "createdAt": "2026-07-11T00:00:00Z",
      "updatedAt": "2026-07-11T00:00:00Z"
    }
  ],
  "altLabels": [],
  "hiddenLabels": [],
  "definition": "",
  "scopeNote": "",
  "historyNote": "",
  "broader": ["<uuid>"],
  "narrower": ["<uuid>"],
  "related": ["<uuid>"],
  "ancestors": ["<uuid>"],
  "replacedBy": null,
  "version": 1,
  "createdAt": "2026-07-11T00:00:00Z",
  "updatedAt": "2026-07-11T00:00:00Z"
}
```

**Destaques do modelo:**
- `prefLabels[]` — rótulos como objetos (SKOS-XL), não literais
- `accessLevel` por rótulo — governa visibilidade individual (Princípios CARE)
- `ancestors[]` — Array of Ancestors para O(1) em consultas hierárquicas
- `version` — campo de otimistic locking (conflito → HTTP 409)
- `status: candidate` — todo conceito recém-adquirido aguarda curadoria

---

## Portas e Perfis de Acesso

| Contexto | Porta | Auth | Capacidades |
|---|---|---|---|
| Apresentação | 4000 | Nenhuma | Listar e buscar conceitos `active`; omite rótulos `sacred`/`restricted` |
| Curadoria | 4001 | bcrypt (basic auth) | CRUD completo, aquisição, trilha de auditoria, deprecação |

---

## Stack Tecnológica

- **Backend**: Node.js 20 LTS + Express.js + better-sqlite3
- **Frontend**: HTMX 2.x + Alpine.js 3.x + Tailwind CSS 3.x (tema `forest`, idêntico ao BioCultDB)
- **Template Engine**: EJS (server-side rendering)
- **Banco de Dados**: SQLite (JSON1 + FTS5) — arquivo compartilhado com a ferramenta principal da unidade hospedeira (`biocultdb.sqlite` no BioCultDB; `unidade.sqlite` nas demais unidades, ADR-005)
- **Visualização**: Cytoscape.js (grafos de relacionamentos)
- **Testes**: Jest + Supertest + SQLite `:memory:`
- **Deploy**: Docker (Alpine Linux)

---

## Instalação e Desenvolvimento

```bash
# Backend
cd backend
npm install
npm run dev:public    # Interface pública  — porta 4000
npm run dev:admin     # Interface admin    — porta 4001
npm test

# Frontend (build CSS Tailwind)
cd frontend
npm install
npm run build:css     # Build CSS
npm run watch:css     # Watch mode
```

### Configuração de autenticação admin

**Opção A — simples** (desenvolvimento e UNRAID):

```env
ADMIN_USERNAME=curador1
ADMIN_PASSWORD=sua_senha
```

O sistema faz o hash bcrypt automaticamente na inicialização.

**Opção B — produção** (múltiplos usuários, hash pré-gerado):

```env
ADMIN_USERS=[{"username":"curador1","passwordHash":"$2b$10$..."}]
```

Gerar o hash: `node -e "import('bcrypt').then(m=>m.default.hash('senha',10).then(console.log))"`

**Sem Docker standalone neste repositório**: este repositório não gera mais nenhum Dockerfile/imagem
próprio (ver "Módulo Compartilhado via Git Submodule" acima e a atualização de ADR-007 em
`Arquitetura-BioCultural`). Para testar mudanças de código localmente antes de commit + push, rode os
dois contextos diretamente com `npm run dev:public` / `npm run dev:admin` (seção "Instalação e
Desenvolvimento" acima) contra um `SQLITE_DB_PATH` local.

> **Este repositório está congelado como produto standalone** (ver "Módulo Compartilhado via Git
> Submodule" acima): em produção, o BioCultTermos roda **exclusivamente** dentro da unidade dual-app
> da instância hospedeira que o embute (hoje só o BioCultDB, `docker/Dockerfile.unidade`, imagem
> `ghcr.io/edalcin/biocultdb:latest`) — nunca isolado. Cada instância hospedeira mantém seu próprio
> Dockerfile/CI (ver fluxo de submodule em `BioCultDB/integracao.md` §7, replicado em `integracao.md`
> de cada unidade hospedeira). `docs/deployment.md` e `docs/instalacao-unraid.md` abaixo descrevem o
> modelo standalone anterior — histórico, não o caminho de deploy atual.

Documentação detalhada:
- [Desenvolvimento local](docs/desenvolvimento.md)
- [Deployment em produção (modelo standalone anterior, descontinuado — ver nota acima)](docs/deployment.md)
- [Instalação no UNRAID (modelo standalone anterior, descontinuado — ver nota acima)](docs/instalacao-unraid.md)

---

## Princípios CARE

O BioCultTermos implementa os Princípios CARE para dados de povos indígenas:

| Princípio | Implementação |
|---|---|
| **C**ollective Benefit | Vocabulário gerenciado pelas próprias comunidades via interface de curadoria |
| **A**uthority to Control | `accessLevel` por rótulo: `public`, `restricted`, `sacred` |
| **R**esponsibility | Trilha de auditoria completa por campo e por responsável |
| **E**thics | Aquisição não-invasiva (leitura de dados já publicados pela ferramenta principal de cada unidade) |

---

## Referências e Padrões

- [W3C SKOS-XL](https://www.w3.org/TR/skos-reference/skos-xl.html) — Simple Knowledge Organization System eXtension for Labels
- [Especificação SKOS (PDF)](docs/simple_knowledge_organization_system_skos.pdf) — Referência completa
- [Princípios CARE](https://www.gida-global.org/care) — Governança de dados indígenas
- [Darwin Core](https://dwc.tdwg.org/) — Interoperabilidade com biodiversidade
- [Protocolo de Nagoya](https://www.cbd.int/abs/) — Repartição de benefícios
- [Arquitetura BioCultural](https://github.com/edalcin/Arquitetura-BioCultural) — Ecossistema integrado
- [BioCultDB](https://github.com/edalcin/BioCultDB) · [BioCultRelatos](https://github.com/edalcin/BioCultRelatos) · [BioCultAcervos](https://github.com/edalcin/BioCultAcervos) · [BioCultNaturalistas](https://github.com/edalcin/BioCultNaturalistas) — unidades hospedeiras (ferramentas principais que embutem este módulo)

## Arquitetura BioCultural Federada — v3.2

O **BioCultTermos** faz parte da [Arquitetura BioCultural](https://github.com/edalcin/Arquitetura-BioCultural), um ecossistema federado para gestão de Conhecimento Tradicional Associado à Biodiversidade (CTA). Na arquitetura federada (v3.2), o BioCultTermos assume um papel central e diferente da versão anterior.

### Papel do BioCultTermos na Federação

Na arquitetura federada v3.2, **cada membro opera sua própria instância soberana do BioCultTermos** com seu próprio `skos:ConceptScheme`. O BioCultTermos deixa de ser uma infraestrutura terminológica central compartilhada e passa a ser um componente **por membro** — garantindo o princípio **Authority to Control** do CARE: cada comunidade ou iniciativa é dona de seus próprios vocabulários.

```mermaid
graph TD
    subgraph I1["Iniciativa de Fontes Secundárias"]
        ET1(BioCultTermos\nConceptScheme: I1) <--> SDB1[(SQLite I1)]
    end
    subgraph C2["Comunidade Tradicional"]
        ET2(BioCultTermos\nConceptScheme: C2) <--> SDB2[(SQLite C2)]
    end
    subgraph AC["Acervos Históricos e Museológicos"]
        ET3(BioCultTermos\nConceptScheme: AC) <--> SDB3[(SQLite AC)]
    end
    subgraph NA["Obras de Naturalistas séc. XVII-XIX"]
        ET4(BioCultTermos\nConceptScheme: NA) <--> SDB4[(SQLite NA)]
    end
    subgraph PL["Pluriverso"]
        MAP["Mapeamentos SKOS-XL\nskos:exactMatch\nskos:closeMatch\nskos:broadMatch"]
    end
    ET1 -->|"harvest REST\n(ConceptScheme público)"| MAP
    ET2 -->|"harvest REST\n(ConceptScheme público)"| MAP
    ET3 -->|"harvest REST\n(ConceptScheme público)"| MAP
    ET4 -->|"harvest REST\n(ConceptScheme público)"| MAP
```

O **Pluriverso** mantém uma camada de mapeamentos semânticos (`skos:exactMatch`, `skos:closeMatch`, `skos:broadMatch`) entre os `ConceptScheme` de diferentes membros. Isso permite que uma busca semântica federada encontre registros independentemente de qual termo cada membro usa para o mesmo conceito.

### Soberania dos Vocabulários

- **Cada membro** mantém autoridade total sobre seus conceitos, rótulos (`skosxl:prefLabel`, `skosxl:altLabel`) e relações
- **Nenhum membro** pode alterar o vocabulário de outro
- **O Pluriverso** propõe mapeamentos; o Comitê Federado os aprova — nunca são impostos
- **Saída da federação**: ao sair, todos os mapeamentos envolvendo os conceitos desse membro são removidos do Pluriverso

### Mudanças Necessárias para a Federação

> **Nota**: Nenhuma implementação está sendo realizada agora.

| Mudança | Descrição |
|---------|-----------|
| **Endpoint de harvest de ConceptScheme** | Implementar `GET /api/federation/concepts` retornando os conceitos públicos do `ConceptScheme` do membro, para coleta pelo Pluriverso |
| **Campo `member_id`** | Cada conceito e rótulo deve carregar `member_id` para rastreabilidade nos mapeamentos federados |
| **Isolamento de instância** | Garantir que cada instância é completamente independente (sem dependência de outras instâncias via rede) |
| **Nível de acesso por conceito** | Suporte a `accessLevel` por conceito além de por rótulo (alguns conceitos podem ser `restricted` ou `sacred` na totalidade) |

### Componentes Relacionados

| Componente | Relação |
|------------|---------|
| **[BioCultDB](https://github.com/edalcin/BioCultDB)** | Unidade hospedeira em produção; embute o BioCultTermos via git submodule como sua infraestrutura terminológica soberana |
| **[BioCultRelatos](https://github.com/edalcin/BioCultRelatos)** | Cada Comunidade Tradicional opera sua própria instância do BioCultTermos integrada ao seu BioCultRelatos |
| **[BioCultAcervos](https://github.com/edalcin/BioCultAcervos)** | Cada acervo histórico/museológico membro opera sua própria instância do BioCultTermos integrada ao seu BioCultAcervos |
| **[BioCultNaturalistas](https://github.com/edalcin/BioCultNaturalistas)** | Cada membro de Obras de Naturalistas opera sua própria instância do BioCultTermos integrada ao seu BioCultNaturalistas |
| **[Pluriverso](https://github.com/edalcin/pluriverso)** | Coleta ConceptSchemes públicos e mantém mapeamentos SKOS entre membros |
| **[Arquitetura BioCultural](https://github.com/edalcin/Arquitetura-BioCultural)** | Documentação completa ([ADR-004](https://github.com/edalcin/Arquitetura-BioCultural/blob/main/docs/architecture-decisions/ADR-004-federated-architecture.md) — federação; [ADR-007](https://github.com/edalcin/Arquitetura-BioCultural/blob/main/docs/architecture-decisions/ADR-007-shared-bioculttermos-module.md) — módulo compartilhado via submodule) |

---

**Status**: v2.0 — congelado como produto standalone, evolução via submodule das unidades hospedeiras (ver "Módulo Compartilhado via Git Submodule" acima)

**Licença**: A definir

**Contato**: [GitHub Issues](https://github.com/edalcin/BioCultTermos/issues) · edalcin@jbrj.gov.br
