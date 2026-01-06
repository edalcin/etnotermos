# Diretrizes para Construção de Vocabulários

**Baseado em**: ANSI/NISO Z39.19-2005 (R2010) - Diretrizes para a Construção, Formato e Gestão de Vocabulários Controlados Monolíngues

Este documento fornece diretrizes operacionais para construir e manter o vocabulário etnobotânico EtnoTermos seguindo padrões internacionais.

## 1. Princípios de Seleção de Termos (Z39.19 Seção 6)

### 1.1 Justificativa para Inclusão de Termos

Os termos devem ser incluídos no vocabulário com base em:
- **Garantia literária**: Termos que aparecem em literatura e pesquisa etnobotânica
- **Garantia de usuário**: Termos usados por membros da comunidade e pesquisadores de campo
- **Garantia organizacional**: Termos necessários para os objetivos específicos da documentação etnobotânica

### 1.2 Especificidade de Termos (Z39.19 Seção 6.4)

- Use **pré-coordenação** para conceitos compostos (ex.: "preparação medicinal de raiz")
- Equilibre especificidade com generalidade baseando-se nas necessidades da coleção
- Inclua tanto termos amplos para navegação quanto termos específicos para precisão
- Exemplo de hierarquia: Plantas → Plantas Medicinais → Raízes Medicinais → Raiz de Ipecacuanha

### 1.3 Formas de Termos a Evitar

Seguindo Z39.19 Seção 6.5:
- Evite termos excessivamente amplos que carecem de especificidade
- Evite termos sem significado sem limites conceituais claros
- Evite termos específicos demais para o escopo da coleção

## 2. Convenções de Forma de Termos (Z39.19 Seção 7)

### 2.1 Forma Gramatical

- **Substantivos**: Forma preferida para a maioria dos termos etnobotânicos
  - Use singular para conceitos (ex.: "planta", "raiz")
  - Use plural para itens contáveis quando apropriado (ex.: "sementes", "folhas")
- **Locuções substantivas**: Aceitáveis para conceitos compostos (ex.: "chá medicinal", "extrato de casca")
- **Adjetivos**: Apenas quando representam conceitos distintos (ex.: "tóxico", "comestível")

### 2.2 Sintaxe e Ordem das Palavras

- **Ordem natural das palavras**: Use a ordem convencional das frases
  - Correto: "planta medicinal"
  - Evite: "planta, medicinal"
- **Formas invertidas**: Apenas quando necessário para agrupamento
  - Exemplo: "plantas, aquáticas" agrupa todos os tipos de plantas aquáticas

### 2.3 Singular vs. Plural

- **Singular**: Para conceitos abstratos, processos, propriedades
  - Exemplos: "fermentação", "toxicidade", "cura"
- **Plural**: Para objetos contáveis, especialmente em contextos etnobotânicos
  - Exemplos: "sementes", "raízes", "folhas", "flores"

### 2.4 Abreviações e Acrônimos

- Escreva os termos por extenso como forma preferida
- Inclua abreviações como termos não-preferidos com referência USE
- Exemplo:
  - Preferido: "Ácido desoxirribonucleico"
  - Não-preferido: "DNA" USE Ácido desoxirribonucleico

### 2.5 Termos Compostos (Z39.19 Seção 7.2)

**Termos pré-coordenados** são criados quando:
- A combinação representa um conceito distinto
- Os usuários comumente buscam pela frase
- Exemplo: "cerimônia de ayahuasca" (não apenas "ayahuasca" + "cerimônia")

## 3. Relacionamentos (Z39.19 Seção 8)

### 3.1 Relacionamentos de Equivalência (Seção 8.2)

**USE e UP (Usado Para)** estabelecem preferência de termo:

```
Termo não-preferido: Mandioca
USE: Cassava

Termo preferido: Cassava
UP: Mandioca
UP: Manioc
UP: Yuca
```

**Quando criar relacionamentos de equivalência**:
- Sinônimos e quase-sinônimos
- Variantes ortográficas
- Nomes comuns vs. nomes científicos
- Acrônimos e abreviações
- Terminologia popular vs. técnica
- Palavras emprestadas e traduções

### 3.2 Relacionamentos Hierárquicos (Seção 8.3)

Três tipos de relacionamentos hierárquicos:

#### 3.2.1 Relacionamentos Genéricos (TG/TE - Termo Genérico/Termo Específico)

**Relacionamentos classe-para-classe** onde o termo mais específico é um tipo do termo mais amplo:

```
Plantas Medicinais
  TE: Plantas Analgésicas
    TE: Papoula-do-ópio
    TE: Salgueiro
  TE: Plantas Antimicrobianas
```

**Teste**: "X é um tipo de Y" ou "X é uma espécie de Y"

#### 3.2.2 Relacionamentos Partitivos (TGP/TEP - Termo Genérico Partitivo/Termo Específico Partitivo)

**Relacionamentos todo-para-parte**:

```
Planta
  TEP: Raiz
  TEP: Caule
  TEP: Folha
  TEP: Flor
  TEP: Semente
```

**Teste**: "X é parte de Y" ou "Y inclui X"

#### 3.2.3 Relacionamentos de Instância (TGI/TEI - Termo Genérico de Instância/Termo Específico de Instância)

**Relacionamentos classe-para-instância**:

```
Plantas Medicinais
  TEI: Planta de sabugueiro no canteiro A do jardim etnobotânico
  TEI: Planta de tabaco sagrado da comunidade Guarani
```

**Teste**: "X é uma instância de Y" ou "X é um exemplo de Y"

#### 3.2.4 Polihierarquia

Termos podem ter **múltiplos termos mais amplos** em diferentes contextos:

```
Cannabis
  TG: Plantas Medicinais
  TG: Plantas Fibrosas
  TG: Plantas Psicoativas
```

### 3.3 Relacionamentos Associativos (Seção 8.4)

**TR (Termo Relacionado)** conecta termos com associação conceitual mas sem relacionamento hierárquico:

```
Raízes Medicinais
  TR: Métodos de Preparação de Raízes
  TR: Medicina Tradicional
  TR: Herbalismo
  TR: Taxonomia Vegetal
```

**Quando usar TR**:
- Processo e agente (ex.: "fermentação" TR "bebidas fermentadas")
- Causa e efeito (ex.: "toxicidade" TR "plantas venenosas")
- Ação e produto (ex.: "extração" TR "extratos vegetais")
- Disciplina e assunto (ex.: "etnobotânica" TR "conhecimento ecológico tradicional")
- Objeto e propriedade (ex.: "plantas" TR "comestibilidade")

## 4. Notas e Referências (Z39.19 Seção 10)

### 4.1 Notas de Escopo (Seção 10.2)

Definem **limites e contexto de uso do termo**:

```
Termo: Ayahuasca
Nota de Escopo: Refere-se tanto à bebida psicoativa preparada a partir do cipó
Banisteriopsis caapi e folhas de Psychotria viridis, quanto ao contexto cerimonial
tradicional de seu uso nas culturas indígenas amazônicas. Para as espécies vegetais
em si, veja Banisteriopsis caapi e Psychotria viridis.
```

### 4.2 Notas de Definição (Seção 10.3)

Fornecem **definições formais**:

```
Termo: Etnobotânica
Definição: O estudo científico do conhecimento e costumes tradicionais de povos
em relação às plantas e seus usos medicinais, religiosos e outros.
```

### 4.3 Notas Históricas (Seção 10.4)

Documentam **evolução do termo**:

```
Termo: Cassava
Nota Histórica: Anteriormente listado como "Manioc" até 2023. Termo alterado para
"Cassava" com base no aumento do uso na literatura etnobotânica contemporânea
e preferência expressa pelas comunidades fonte.
```

### 4.4 Notas de Fonte (Bibliográficas)

Fornecem **citações e referências**:

```
Termo: Tabaco Sagrado
Nota Bibliográfica: Ver Wilbert, Johannes. "Tobacco and Shamanism in South
America." Yale University Press, 1987.
```

## 5. Controle de Autoridade (Z39.19 Seção 9)

### 5.1 Um Conceito, Um Termo

- Cada conceito distinto deve ter **exatamente um termo preferido**
- Todas as variantes tornam-se termos não-preferidos com referências USE
- Manter consistência em todo o vocabulário

### 5.2 Desambiguação de Homógrafos

Quando a **mesma palavra representa conceitos diferentes**, use qualificadores:

```
Cedro (árvore) - A planta viva
Cedro (madeira) - O material extraído da planta
```

### 5.3 Gestão de Status de Termos

Rastrear ciclo de vida do termo:
- **Candidato**: Sob revisão para inclusão
- **Ativo**: Termo atual, aprovado
- **Descontinuado**: Não mais usado, substituído por outro termo

Ao descontinuar:
```
Termo: Cânhamo indiano (descontinuado)
Substituído por: Cannabis
Nota Histórica: Termo descontinuado devido a linguagem culturalmente inapropriada.
Todas as referências históricas preservadas sob o novo termo.
```

## 6. Manutenção do Vocabulário

### 6.1 Ciclos de Revisão Regulares

- **Revisão anual**: Verificar terminologia desatualizada
- **Validação comunitária**: Engajar com detentores de conhecimento
- **Atualizações de literatura**: Incorporar novos achados de pesquisa

### 6.2 Gestão de Mudanças

Ao modificar o vocabulário:
1. Documentar o motivo da mudança
2. Preservar informações históricas
3. Criar redirecionamentos de termos antigos
4. Atualizar todos os relacionamentos afetados
5. Notificar usuários de mudanças significativas

### 6.3 Controle de Qualidade

- **Validação de reciprocidade**: Garantir que relacionamentos TG/TE e TR sejam bidirecionais
- **Detecção de órfãos**: Identificar termos desconectados
- **Verificações de consistência**: Verificar convenções de forma de termo
- **Lógica de relacionamento**: Prevenir hierarquias circulares

## 7. Exibição e Apresentação (Z39.19 Seção 11)

### 7.1 Exibição Alfabética

Listagem padrão A-Z com:
- Termos preferidos em negrito
- Termos não-preferidos com referências USE
- Referências cruzadas claramente indicadas

### 7.2 Exibição Hierárquica

Mostrar relacionamentos de termos:
```
Plantas Medicinais
  . Plantas Analgésicas
  . . Papoula-do-ópio
  . . Salgueiro
  . Plantas Antimicrobianas
  . . Alho
  . . Equinácea
```

### 7.3 Exibição Sistemática (Facetada)

Agrupar por características:
```
Por Parte da Planta:
  Raízes | Caules | Folhas | Flores | Sementes

Por Tipo de Uso:
  Medicinal | Nutricional | Cerimonial | Material

Por Preparação:
  Cru | Seco | Decocção | Tintura | Cataplasma
```

## 8. Considerações Especiais para Contexto Etnobotânico

### 8.1 Termos Multilíngues

- Documentar termos em línguas indígenas
- Fornecer guias de pronúncia quando possível
- Respeitar preferências de nomenclatura dos detentores de conhecimento

### 8.2 Sensibilidade Cultural

- Usar terminologia preferida pelas comunidades fonte
- Evitar termos culturalmente inapropriados ou ofensivos
- Documentar conhecimento tradicional com atribuição adequada
- Seguir os Princípios CARE para Governança de Dados Indígenas

### 8.3 Nomes Científicos vs. Tradicionais

Equilibrar taxonomia formal com nomenclatura tradicional:
```
Preferido: Ayahuasca
UP: Banisteriopsis caapi (nome científico)
UP: Yagé (variante regional)
UP: Caapi
Nota de Escopo: Preparação tradicional e contexto cerimonial
TR: Banisteriopsis caapi (espécie botânica)
```

## 9. Lista de Verificação de Conformidade

Antes de liberar atualizações do vocabulário, verificar:

- [ ] Todos os termos seguem convenções de forma (Seção 7)
- [ ] Relacionamentos são devidamente tipificados e recíprocos (Seção 8)
- [ ] Notas de escopo definem limites de termos (Seção 10.2)
- [ ] Homógrafos estão desambiguados (Seção 9)
- [ ] Termos descontinuados têm referências de substituição
- [ ] Controle de autoridade mantém o princípio um-conceito-um-termo
- [ ] Formatos de exibição atendem necessidades do usuário (Seção 11)
- [ ] Sensibilidade cultural revisada com as comunidades
- [ ] Atribuição de fonte está completa e precisa

## Referências

- ANSI/NISO Z39.19-2005 (R2010). *Guidelines for the Construction, Format, and Management of Monolingual Controlled Vocabularies*. National Information Standards Organization.
- Princípios CARE para Governança de Dados Indígenas: https://www.gida-global.org/care
- W3C SKOS Simple Knowledge Organization System: https://www.w3.org/2004/02/skos/
