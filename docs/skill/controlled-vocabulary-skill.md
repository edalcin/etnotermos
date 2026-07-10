---
name: controlled-vocabulary
description: >
  Skill especializada na construção, proposta e manutenção de vocabulários controlados
  para conhecimento tradicional sobre uso de recursos da biodiversidade (plantas e animais),
  seguindo o padrão ANSI/NISO Z39.19-2005 (R2010) e os Princípios CARE para Governança
  de Dados Indígenas. Use esta skill sempre que o usuário quiser:
  - Propor novos termos para o vocabulário (BioCultTermos ou similar)
  - Definir ou revisar relacionamentos hierárquicos (BT/NT) ou associativos (RT)
  - Documentar a estrutura conceitual de um vocabulário etnobotânico ou etnozoológico
  - Auditar qualidade e consistência do vocabulário
  - Deprecar termos inadequados e propor substitutos culturalmente sensíveis
  - Discutir nomes em línguas indígenas, nomes científicos vs. tradicionais, polissemia
  - Estruturar facetas temáticas para indexação de conhecimento tradicional
  Acione também quando o usuário mencionar: BioCultTermos, SKOS, tesauro, termos controlados,
  indexação etnobotânica, vocabulário, relacionamentos BT/NT/RT, thesaurus.
---

# Skill: Vocabulário Controlado para Conhecimento Tradicional

Esta skill guia a construção e manutenção de vocabulários controlados para documentar
conhecimento tradicional sobre recursos da biodiversidade, seguindo a norma
**ANSI/NISO Z39.19-2005 (R2010)** e os **Princípios CARE** para dados indígenas.

> **Referência operacional completa**: `references/vocabulary-guidelines.md`
> Leia este arquivo quando precisar de detalhes sobre convenções de forma, tipos de
> relacionamento, notas documentais ou listas de verificação de qualidade.

---

## Fluxo de trabalho por tarefa

### 1. Proposta de novo termo

Quando o usuário pede para incluir um novo conceito no vocabulário:

**Passo 1 — Avaliar o warrant (justificativa de inclusão)**
- *Literary warrant*: o termo aparece na literatura etnobotânica/etnozoológica?
- *User warrant*: pesquisadores de campo ou comunidades usam o termo?
- *Organizational warrant*: é necessário para os objetivos do sistema?

**Passo 2 — Determinar a forma preferida**
- Substantivo no singular (conceitos, processos, propriedades)
- Substantivo no plural (objetos contáveis: sementes, raízes, folhas)
- Sintagma nominal em ordem natural: "planta medicinal" ✓ / "medicinal, planta" ✗
- Desambiguar homógrafos com qualificador: `cedro (árvore)` / `cedro (madeira)`

**Passo 3 — Mapear relacionamentos**

| Tipo | Código | Teste de validação |
|------|--------|-------------------|
| Termo mais amplo genérico | BTG | "X é um tipo de Y?" |
| Termo mais amplo partitivo | BTP | "X é parte de Y?" |
| Termo mais amplo instancial | BTI | "X é um exemplo de Y?" |
| Termo mais específico | NT | inverso dos acima |
| Termo relacionado | RT | associação sem hierarquia |
| Termo preferido | USE | de não-preferido → preferido |
| Termo não-preferido | UF | de preferido → variantes |

**Passo 4 — Documentar notas**
- `Scope Note`: delimita o uso e distingue de termos vizinhos
- `Definition`: definição formal
- `History Note`: se o termo substituiu outro
- `Bibliographic Note`: referência de fonte

**Passo 5 — Entregar proposta estruturada** (ver template abaixo)

---

### 2. Revisão de relacionamentos BT/NT/RT

Ao revisar um conjunto de termos, verificar:

1. **Reciprocidade**: todo BT tem o NT correspondente e vice-versa; RT é sempre bidirecional
2. **Tipo correto**: genérico (BTG/NTG) ≠ partitivo (BTP/NTP) ≠ instancial (BTI/NTI)
3. **Polihierarquia legítima**: um termo pode ter múltiplos BTs em facetas diferentes
4. **Circularidade proibida**: A BT B BT A → erro
5. **Especificidade adequada**: evitar saltos hierárquicos (pular níveis)

---

### 3. Auditoria de qualidade

Execute verificações na seguinte ordem:

```
[ ] Termos órfãos (sem nenhum BT e sem ser Top Term declarado)
[ ] Relacionamentos não-recíprocos (BT sem NT correspondente)
[ ] Homógrafos sem qualificador
[ ] Termos com forma não-convencional (invertidos, com abreviações não documentadas)
[ ] Scope notes ausentes em termos ambíguos
[ ] Termos em línguas indígenas sem transliteração ou fonte
[ ] Nomes científicos sem equivalente preferido em vernáculo
[ ] Termos culturalmente sensíveis sem revisão comunitária documentada
[ ] Ciclos hierárquicos (A→B→A)
[ ] USE/UF não-recíprocos
```

Para cada problema encontrado, reportar:
- **Termo afetado**
- **Tipo de problema**
- **Ação recomendada**

---

### 4. Depreciação de termos

Quando um termo deve ser removido ou substituído:

1. Alterar status: `Candidato → Ativo → Depreciado`
2. Criar `History Note` com a razão (ex: linguagem inadequada, fusão de conceitos)
3. Definir termo substituto com `USE` reference
4. Preservar o registro depreciado (não excluir)
5. Atualizar todos os termos que tinham RT com o termo depreciado

---

### 5. Documentação de estrutura de vocabulário (proposta conceitual)

Quando o usuário quer estruturar um domínio novo (ex: "etnozoologia", "uso de fungos"):

1. **Identificar facetas principais** do domínio
2. **Propor Top Terms** (termos raiz de cada faceta)
3. **Esboçar hierarquias** com 2–3 níveis iniciais
4. **Mapear intersecções** entre facetas (polihierarquia)
5. **Listar termos prioritários** por warrant
6. Entregar como **proposta em Markdown** para revisão

---

## Template de proposta de termo

```markdown
## [TERMO PREFERIDO]

**Status**: Candidato | Ativo | Depreciado
**Língua**: pt | en | [código ISO 639]
**Domínio**: Etnobotânica | Etnozoologia | Uso de Recursos | ...

### Forma preferida
[Termo na forma canônica]

### Termos não-preferidos (UF)
- [sinônimo 1]
- [nome científico, se variante]
- [termo em língua indígena, com indicação do povo/língua]
- [variante regional]

### Relacionamentos hierárquicos
- **BT** (Broader Term): [termo mais amplo]
- **NT** (Narrower Term): [termos mais específicos, se houver]

### Relacionamentos associativos
- **RT** (Related Term): [termos relacionados sem hierarquia]

### Notas documentais
- **Scope Note**: [delimitar uso; distinguir de termos vizinhos]
- **Definition**: [definição formal, se disponível]
- **History Note**: [se substituiu outro termo]
- **Bibliographic Note**: [fonte ou referência]

### Considerações culturais
- [ ] Termo validado com comunidade detentora do conhecimento?
- [ ] Segue preferência de nomenclatura da comunidade fonte?
- [ ] Atribui corretamente a origem do conhecimento (povo/região)?
- [ ] Respeita restrições de acesso (conhecimento sagrado/restrito)?
```

---

## Estrutura de facetas sugerida para conhecimento tradicional

Esta estrutura pode ser usada como ponto de partida e adaptada ao escopo do projeto:

```
1. RECURSOS DA BIODIVERSIDADE
   1.1 Plantas
       1.1.1 Por parte usada (raízes, folhas, cascas, frutos, sementes...)
       1.1.2 Por hábito (árvores, arbustos, ervas, lianas, epífitas...)
       1.1.3 Por ecossistema (Amazônia, Cerrado, Caatinga, Mata Atlântica...)
   1.2 Animais
       1.2.1 Por grupo taxonômico (mamíferos, aves, répteis, insetos, peixes...)
       1.2.2 Por parte usada (ossos, penas, gordura, mel...)
   1.3 Fungos e outros organismos

2. USOS E APLICAÇÕES
   2.1 Medicinais e terapêuticos
   2.2 Alimentares e nutricionais
   2.3 Rituais e cerimoniais
   2.4 Materiais e tecnológicos
   2.5 Mágico-religiosos
   2.6 Cosméticos e de higiene
   2.7 Veterinários

3. FORMAS DE PREPARO E MANEJO
   3.1 Métodos de preparo (decocção, infusão, maceração, defumação...)
   3.2 Formas de administração (oral, tópica, inalatória...)
   3.3 Técnicas de coleta e manejo
   3.4 Formas de conservação

4. POVOS, COMUNIDADES E TERRITÓRIOS
   4.1 Povos indígenas (por povo, por família linguística)
   4.2 Comunidades quilombolas
   4.3 Comunidades tradicionais (ribeirinhos, caiçaras, seringueiros...)
   4.4 Territórios e biomas

5. CONTEXTO E TRANSMISSÃO DO CONHECIMENTO
   5.1 Detentores do conhecimento (pajés, parteiras, raizeiros...)
   5.2 Formas de transmissão (oral, ritual, aprendizado prático...)
   5.3 Status do conhecimento (público, restrito, sagrado)

6. CATEGORIAS ANALÍTICAS
   6.1 Etnoclassificação (sistemas taxonômicos locais)
   6.2 Propriedades atribuídas (quente/frio, forte/fraco...)
   6.3 Ecologia do conhecimento (sazonalidade, abundância...)
```

---

## Diretrizes de sensibilidade cultural (CARE + Z39.19)

Estas diretrizes são **centrais** e devem ser aplicadas em todas as tarefas:

### Princípios CARE para dados indígenas

| Princípio | Aplicação no vocabulário |
|-----------|--------------------------|
| **C**oletividade | Termos refletem perspectiva coletiva da comunidade, não de indivíduos |
| **A**utoridade | Comunidades têm autoridade sobre nomenclatura de seu conhecimento |
| **R**esponsabilidade | Documentar com atribuição correta; evitar apropriação |
| **E**tica | Respeitar restrições de acesso; não expor conhecimento sagrado/restrito |

### Regras práticas

1. **Preferência comunitária prevalece** sobre literatura científica na escolha do termo preferido
2. **Nunca usar termos pejorativos ou coloniais** mesmo que presentes na literatura histórica — deprecar com History Note
3. **Línguas indígenas**: incluir como UF com indicação explícita do povo e língua
   - Formato: `nome_do_termo [língua: Guarani | povo: Mbya-Guarani]`
4. **Conhecimento restrito**: marcar na Scope Note quando o acesso deve ser controlado
5. **Nomes científicos**: entrar como UF do termo vernáculo/tradicional preferido (não o contrário)
6. **Validação comunitária**: documentar na History Note se e quando ocorreu

---

## Exemplos de proposta (referência rápida)

### Exemplo 1 — Planta medicinal com múltiplos nomes

```markdown
## Ayahuasca

**Status**: Ativo
**Língua**: pt (empréstimo do quéchua)
**Domínio**: Etnobotânica; Uso Ritual

### Forma preferida
Ayahuasca

### Termos não-preferidos (UF)
- Yagé [língua: espanhol colombiano]
- Cipó-mariri [língua: pt, região amazônica]
- Caapi [língua: quéchua]
- Hoasca [variante ortográfica]
- Banisteriopsis caapi (Spruce ex Griseb.) Morton [nome científico]

### Relacionamentos hierárquicos
- **BT**: Plantas de Uso Ritual
- **BT**: Plantas Psicoativas
- **NT**: Preparação de Ayahuasca (quando referindo à bebida)

### Relacionamentos associativos
- **RT**: Psychotria viridis (chacrona)
- **RT**: Cerimônia do Daime
- **RT**: Xamanismo Amazônico
- **RT**: Cipó

### Notas documentais
- **Scope Note**: Refere-se tanto à liana Banisteriopsis caapi quanto à bebida
  preparada pela combinação com folhas de Psychotria viridis ou outras plantas.
  Para o contexto estritamente botânico da espécie, use Banisteriopsis caapi.
- **Bibliographic Note**: Schultes & Hofmann (1979); Mckenna et al. (1984)

### Considerações culturais
- [x] Termo de origem quéchua, amplamente aceito pelos povos amazônicos
- [ ] Validação formal pendente com União das Nações Indígenas
```

### Exemplo 2 — Depreciação por inadequação cultural

```markdown
## Índio (depreciado)

**Status**: Depreciado
**Substituído por**: Povos Indígenas

**History Note**: Termo depreciado em 2024 por ser considerado inadequado pelas
comunidades e organizações indígenas representativas. Substituído por "Povos
Indígenas" como termo preferido. Registros históricos preservados.
USE: Povos Indígenas
```

---

## Referências

- **ANSI/NISO Z39.19-2005 (R2010)**: norma base para toda a construção do vocabulário
- **Diretrizes operacionais detalhadas**: `references/vocabulary-guidelines.md`
- **CARE Principles**: https://www.gida-global.org/care
- **W3C SKOS**: https://www.w3.org/2004/02/skos/ (para exportação futura)
- **Dublin Core**: para metadados de termos
