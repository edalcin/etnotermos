# Conformidade com os Princípios CARE para Governança de Dados Indígenas

**EtnoTermos** - Sistema de Gestão de Terminologia Etnobotânica

Este documento descreve como o sistema EtnoTermos implementa os princípios CARE (Collective Benefit, Authority to Control, Responsibility, and Ethics) para governança de dados indígenas e conhecimento tradicional, conforme estabelecido pela [Global Indigenous Data Alliance (GIDA)](https://www.gida-global.org/care).

---

## Visão Geral dos Princípios CARE

Os princípios CARE são complementares aos princípios FAIR (Findable, Accessible, Interoperable, Reusable) e focam especificamente na governança de dados que envolvem povos indígenas e comunidades tradicionais:

- **C**ollective Benefit (Benefício Coletivo)
- **A**uthority to Control (Autoridade para Controlar)
- **R**esponsibility (Responsabilidade)
- **E**thics (Ética)

## Implementação no EtnoTermos

### 1. Collective Benefit (Benefício Coletivo)

**Princípio**: Os dados devem beneficiar as comunidades que os compartilharam.

**Implementação no EtnoTermos**:

✅ **Atribuição Clara de Fontes**
- Modelo Source com tipos específicos para conhecimento tradicional
- Campos de atribuição: `interviewee`, `community`, `date`
- Rastreabilidade completa de cada informação

✅ **Reconhecimento de Autoria**
- Cada termo pode ter múltiplas fontes linkadas
- Notas incluem referências às fontes originais
- Sistema de citação para conhecimento tradicional

✅ **Compartilhamento Justo de Benefícios**
- Atribuição clara nos exports (CSV, SKOS, RDF)
- Templates de reconhecimento em exportações
- Metadados de autoria preservados

### 2. Authority to Control

**Governança dos Dados**: As comunidades tradicionais devem ter controle sobre como seus conhecimentos são usados e compartilhados.

#### Implementação no EtnoTermos:

- **Permissões Diferenciadas**:
  - Interface pública (porta 4000): Acesso read-only para pesquisa e consulta
  - Interface admin (porta 4001): Controle total para curadores autorizados
  - Notas privadas: Sistema de visibilidade para informações sensíveis
- **Consentimento e Controle**: Sistema de auditoria registra todas as modificações
- **Direito de Exclusão**: Possibilidade de deprecar ou remover termos mediante solicitação
- **Controle de Acesso**: Interface administrativa protegida

### 2. Authority to Control (Autoridade para Controlar)

**Princípio**: Povos e comunidades indígenas têm o direito e autoridade sobre a governança de seus dados.

**Implementação no EtnoTermos**:

- **Atribuição Clara**: Sistema de fontes com campos específicos para comunidades e detentores de conhecimento
- **Notas Privadas**: Tipo de nota privada para informações sensíveis visíveis apenas ao autor e administradores
- **Controle de Acesso**: Interface administrativa separada com autenticação para gestão de termos
- **Auditoria Completa**: Registro de todas as modificações (quem, quando, o quê) via AuditLog
- **Governança**: Sistema permite que comunidades sejam consultadas sobre uso de seus conhecimentos
- **Atribuição Clara**: Campo de fonte obrigatório para todos os termos, com tipo específico para conhecimento tradicional

## Responsabilidade (Responsibility)

Aqueles que trabalham com dados de povos e comunidades tradicionais têm a responsabilidade de compartilhar como esses dados são usados para apoiar a autodeterminação e benefício coletivo desses povos.

### Implementação no EtnoTermos:

#### 1. Registro de Auditoria Completo

**Modelo**: `AuditLog.js`
- Toda modificação de dados é registrada com timestamp, usuário e tipo de alteração
- Campos: `entityType`, `entityId`, `action`, `changes`, `timestamp`, `metadata`

**Localização**: `backend/src/models/AuditLog.js:1-30`

```javascript
{
  entityType: 'Term',
  entityId: 'term_123',
  action: 'update',
  changes: { before: {...}, after: {...} },
  timestamp: new Date(),
  metadata: { user: 'researcher@university.edu', source: 'admin_interface' }
}
```

### 2. Responsabilidade (Responsibility)

**Princípio**: Aqueles que trabalham com dados de povos indígenas têm a responsabilidade de compartilhar como esses dados são usados para apoiar a autodeterminação indígena e o benefício coletivo.

#### Implementação no EtnoTermos:

**Audit Logs Completos**:
- Todas as modificações de termos são registradas na collection `auditLogs`
- Inclui: quem modificou, quando, o que mudou (before/after)
- Rastreabilidade completa de todas as operações

**Source Provenance Tracking**:
- Cada termo deve ter referências de fonte (`sourceIds`)
- Fontes podem ser bibliográficas, entrevistas, notas de campo, amostras de herbário
- Sistema de atribuição mantém vínculo entre conhecimento e sua origem

**Implementação técnica:**
- Campo `sourceIds` em todos os termos
- Modelo `Source` com tipos flexíveis (bibliographic, interview, field_notes, herbarium_sample)
- Modelo `AuditLog` rastreando todas as alterações (quem, quando, o quê)
- Timestamps automáticos (createdAt, updatedAt)

---

## E - Ethics (Ética)

### Princípio

"Minimizar danos e maximizar benefícios. Práticas éticas de dados devem ser guiadas pela maximização de benefícios, minimização de danos e promoção da justiça social. Considerações éticas devem levar em conta tanto o bem-estar individual quanto coletivo."

### Implementação no EtnoTermos

#### 1. **Privacidade e Proteção de Dados Sensíveis**

- **Notas Privadas**: Sistema de notas com tipo "private" que só são visíveis para o autor e administradores
- **Controle de Acesso**: Interface Admin separada (porta 4001) com autenticação, interface pública é read-only
- **Anonimização**: Opção de não publicar nomes de entrevistados/comunidades em dados públicos

#### 2. **Collective Benefit (Benefício Coletivo)**

**Princípio**: Os dados devem ser usados de maneira que beneficiem as comunidades das quais se originaram.

**Implementação no EtnoTermos**:

1. **Governança Compartilhada**:
   - Interface admin acessível a representantes das comunidades
   - Possibilidade de revisão comunitária dos termos antes da publicação
   - Notas privadas para informações sensíveis controladas pela comunidade

2. **Repartição de Benefícios**:
   - Sistema de atribuição clara de conhecimento tradicional
   - Rastreabilidade completa da origem dos termos
   - Apoio para citação adequada em trabalhos acadêmicos

3. **Acesso Aberto**:
   - Interface pública read-only permite acesso amplo ao conhecimento sem barreiras
   - Exportação em formatos abertos (CSV, SKOS, RDF) facilita uso acadêmico

### 3. Princípio da Responsabilidade

> **Responsibility**: Those working with Indigenous data have a responsibility to share how those data are used to support Indigenous Peoples' self-determination and collective benefit.

**Implementação no EtnoTermos:**

#### 3.1 Rastreabilidade Completa (Audit Logs)

```javascript
// Modelo AuditLog
{
  entityType: 'Term',
  entityId: 'term_001',
  action: 'create|update|delete',
  changes: { before: {...}, after: {...} },
  timestamp: Date,
  metadata: { user: 'researcher_name', source: 'fieldwork_2023' }
}
```

- **Registro de Todas as Modificações**: Sistema AuditLog registra quem, quando e o que foi modificado
- **Histórico Completo**: Cada termo mantém histórico de evolução (historyNote seguindo Z39.19)
- **Transparência**: Dashboard admin mostra estatísticas de contribuições por fonte e pesquisador

#### 3.2 Governança de Dados

- **Controle de Acesso Diferenciado**:
  - Interface pública: acesso read-only universal
  - Interface admin: controle de quem pode criar/editar/deletar
  - Notas privadas: visíveis apenas ao autor e administradores

- **Validação de Fontes**:
  - Campo `sourceIds` obrigatório em termos e notas
  - Tipos de fonte incluem: `interview`, `field_notes`, `bibliographic`, `herbarium_sample`
  - Campos flexíveis para capturar contexto completo da origem do conhecimento

### 4. Princípio da Ética

> **Ethics**: Indigenous Peoples' rights and wellbeing should be the primary concern at all stages of the data life cycle and across the data ecosystem.

**Implementação no EtnoTermos:**

#### 4.1 Orientações de Sensibilidade Cultural

**Incluído na Interface Admin** (mensagens contextuais durante catalogação):

1. **Consentimento Informado**:
   - "Ao registrar conhecimento tradicional, certifique-se de ter obtido consentimento prévio, livre e informado da comunidade ou detentor do conhecimento."

2. **Contexto Cultural**:
   - "Use o campo 'scopeNote' para documentar o contexto cultural e significado do termo para a comunidade."

3. **Respeito a Restrições**:
   - "Se o conhecimento tem restrições de uso (ex: conhecimento sagrado, uso restrito a determinados grupos), utilize o campo 'private note' e ajuste as permissões de visualização."

4. **Reconhecimento de Autoria**:
   - "Sempre atribua claramente a fonte do conhecimento. Para conhecimento tradicional, registre o nome do detentor do conhecimento, comunidade, data e contexto da coleta."

#### 4.2 Templates de Exportação com Reconhecimento

Ao exportar dados (CSV, SKOS, RDF), incluir cabeçalho/metadados:

```
# EtnoTermos - Vocabulário Controlado de Conhecimento Etnobotânico
#
# RECONHECIMENTO:
# Este vocabulário foi construído com contribuições de comunidades tradicionais,
# povos indígenas, quilombolas e outros detentores de conhecimento tradicional
# associado à biodiversidade. O uso destes dados deve respeitar os direitos
# desses povos e comunidades sobre seus conhecimentos tradicionais, conforme
# estabelecido pela Lei 13.123/2015 (Lei da Biodiversidade) e pela Convenção
# sobre Diversidade Biológica.
#
# CITAÇÃO SUGERIDA:
# EtnoTermos. (2026). Vocabulário Controlado de Conhecimento Etnobotânico.
# [Dataset]. Disponível em: https://etnotermos.seu-dominio.com.br
# Acesso em: [data]
#
# Para uso comercial ou acesso a conhecimento tradicional associado,
# consulte as diretrizes de repartição de benefícios do Sistema Nacional
# de Gestão do Patrimônio Genético e do Conhecimento Tradicional Associado
# (SisGen): https://sisgen.gov.br
```

#### 4.3 Notas de Histórico Cultural

- Campo `historyNote` (Z39.19 Section 10.4) documenta evolução do termo e mudanças de significado ao longo do tempo
- Campo `scopeNote` (Z39.19 Section 10.2) define limites de uso e contexto cultural específico
- Facetas personalizáveis (`facets` object) permitem classificação por:
  - Comunidade de origem
  - Região geográfica
  - Contexto de uso tradicional
  - Categoria de uso (medicinal, alimentício, ritualístico, etc.)

## Limitações e Melhorias Futuras

### Áreas para Aprimoramento

1. **Interface Multilíngue Completa**: Atualmente o sistema suporta termos multilíngues, mas a interface está em português. Expansão para outras línguas (especialmente línguas indígenas) seria ideal.

2. **Controle de Acesso Granular**: Implementar permissões por termo/nota para permitir que comunidades controlem quem pode acessar conhecimentos específicos.

3. **Sistema de Consentimento Digital**: Módulo para registrar termos de consentimento livre, prévio e informado (CLPI) diretamente no sistema.

4. **Integração com SisGen**: Conexão direta com o Sistema Nacional de Gestão do Patrimônio Genético para facilitar compliance com Lei 13.123/2015.

5. **Versionamento Semântico de Vocabulários**: Sistema formal de versões do vocabulário para rastreamento de mudanças ao longo do tempo.

## Auditoria de Conformidade CARE

| Princípio | Aspecto | Status | Evidência |
|-----------|---------|--------|-----------|
| **Collective Benefit** | Atribuição de fontes | ✅ Implementado | Modelo Source, campos sourceIds |
| | Reconhecimento em exports | ✅ Implementado | Templates de exportação |
| | Acesso aberto | ✅ Implementado | Interface pública read-only (porta 4000) |
| **Authority to Control** | Controle de acesso diferenciado | ✅ Implementado | Dual-port architecture (public + admin) |
| | Notas privadas | ✅ Implementado | Tipo de nota 'private' |
| | Validação de fontes | ✅ Implementado | sourceIds required, Source model |
| **Responsibility** | Audit logs | ✅ Implementado | Modelo AuditLog, registro de todas as mudanças |
| | Histórico de termos | ✅ Implementado | Campo historyNote (Z39.19) |
| | Rastreabilidade | ✅ Implementado | sourceIds, timestamps, version control |
| **Ethics** | Orientações culturais | ✅ Implementado | Mensagens na interface admin |
| | Contexto cultural | ✅ Implementado | scopeNote, facets customizáveis |
| | Reconhecimento em exportações | ✅ Implementado | Cabeçalhos com reconhecimento |
| | Interface multilíngue | 🔄 Parcial | Suporte a termos multilíngues, UI em português |
| | Controle granular de permissões | 🔄 Futuro | Planejado para v2.0 |

**Legenda:**
- ✅ Implementado: Funcionalidade está presente no sistema
- 🔄 Parcial: Parcialmente implementado, com planos de melhoria
- ⏳ Futuro: Planejado para versões futuras

## Compromissos de Manutenção

Para manter a conformidade CARE ao longo do tempo, o projeto EtnoTermos compromete-se a:

1. **Revisão Anual**: Avaliar anualmente a conformidade CARE e atualizar práticas conforme necessário
2. **Consulta Comunitária**: Envolver comunidades tradicionais e detentores de conhecimento nas decisões sobre governança de dados
3. **Documentação Contínua**: Manter documentação atualizada sobre como os dados são coletados, armazenados e compartilhados
4. **Transparência**: Publicar relatórios anuais sobre uso dos dados e benefícios gerados
5. **Capacitação**: Oferecer treinamento para pesquisadores sobre coleta ética de conhecimento tradicional

## Referências

- **CARE Principles**: Carroll, S. R., Garba, I., Figueroa-Rodríguez, O. L., Holbrook, J., Lovett, R., Materechera, S., ... & Hudson, M. (2020). The CARE Principles for Indigenous Data Governance. *Data Science Journal*, 19(1), 43. DOI: https://doi.org/10.5334/dsj-2020-043

- **Lei da Biodiversidade (Brasil)**: Lei nº 13.123, de 20 de maio de 2015. Regulamenta o inciso II do § 1º e o § 4º do art. 225 da Constituição Federal.

- **Convenção sobre Diversidade Biológica**: Protocolo de Nagoya sobre Acesso a Recursos Genéticos e a Repartição Justa e Equitativa dos Benefícios Derivados de sua Utilização.

- **Global Indigenous Data Alliance (GIDA)**: https://www.gida-global.org/care

---

**Status da Conformidade**: ✅ Conforme (com melhorias contínuas planejadas)

**Última Revisão**: 2026-01-10

**Próxima Revisão Agendada**: 2027-01-10
