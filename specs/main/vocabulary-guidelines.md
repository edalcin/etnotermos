# Vocabulary Construction Guidelines

**Based on**: ANSI/NISO Z39.19-2005 (R2010) - Guidelines for the Construction, Format, and Management of Monolingual Controlled Vocabularies

This document provides operational guidelines for building and maintaining the EtnoTermos ethnobotanical vocabulary following international standards.

## 1. Term Selection Principles (Z39.19 Section 6)

### 1.1 Warrant for Term Inclusion

Terms should be included in the vocabulary based on:
- **Literary warrant**: Terms appearing in ethnobotanical literature and research
- **User warrant**: Terms used by community members and field researchers
- **Organizational warrant**: Terms needed for the specific goals of ethnobotanical documentation

### 1.2 Term Specificity (Z39.19 Section 6.4)

- Use **pre-coordination** for compound concepts (e.g., "medicinal root preparation")
- Balance specificity with generality based on collection needs
- Include both broad terms for navigation and specific terms for precision
- Example hierarchy: Plants → Medicinal Plants → Medicinal Roots → Ipecac Root

### 1.3 Term Forms to Avoid

Following Z39.19 Section 6.5:
- Avoid overly broad terms that lack specificity
- Avoid meaningless terms without clear conceptual boundaries
- Avoid terms that are too specific for the collection's scope

## 2. Term Form Conventions (Z39.19 Section 7)

### 2.1 Grammatical Form

- **Nouns**: Preferred form for most ethnobotanical terms
  - Use singular for concepts (e.g., "plant", "root")
  - Use plural for countable items when appropriate (e.g., "seeds", "leaves")
- **Noun phrases**: Acceptable for compound concepts (e.g., "medicinal tea", "bark extract")
- **Adjectives**: Only when representing distinct concepts (e.g., "toxic", "edible")

### 2.2 Syntax and Word Order

- **Natural word order**: Use conventional phrase order
  - Correct: "medicinal plant"
  - Avoid: "plant, medicinal"
- **Inverted forms**: Only when needed for grouping
  - Example: "plants, aquatic" groups all aquatic plant types together

### 2.3 Singular vs. Plural

- **Singular**: For abstract concepts, processes, properties
  - Examples: "fermentation", "toxicity", "healing"
- **Plural**: For countable objects, especially in ethnobotanical contexts
  - Examples: "seeds", "roots", "leaves", "flowers"

### 2.4 Abbreviations and Acronyms

- Spell out terms in full as preferred form
- Include abbreviations as non-preferred terms with USE reference
- Example:
  - Preferred: "Deoxyribonucleic acid"
  - Non-preferred: "DNA" USE Deoxyribonucleic acid

### 2.5 Compound Terms (Z39.19 Section 7.2)

**Pre-coordinated terms** are created when:
- The combination represents a distinct concept
- Users commonly search for the phrase
- Example: "ayahuasca ceremony" (not just "ayahuasca" + "ceremony")

## 3. Relationships (Z39.19 Section 8)

### 3.1 Equivalence Relationships (Section 8.2)

**USE and UF (Used For)** relationships establish term preference:

```
Non-preferred term: Mandioca
USE: Cassava

Preferred term: Cassava
UF: Mandioca
UF: Manioc
UF: Yuca
```

**When to create equivalence relationships**:
- Synonyms and near-synonyms
- Variant spellings
- Common names vs. scientific names
- Acronyms and abbreviations
- Popular vs. technical terminology
- Loan words and translations

### 3.2 Hierarchical Relationships (Section 8.3)

Three types of hierarchical relationships:

#### 3.2.1 Generic Relationships (BTG/NTG)

**Class-to-class relationships** where narrower term is a type of broader term:

```
Medicinal Plants
  NTG: Analgesic Plants
    NTG: Opium Poppy
    NTG: Willow
  NTG: Antimicrobial Plants
```

**Test**: "X is a type of Y" or "X is a kind of Y"

#### 3.2.2 Partitive Relationships (BTP/NTP)

**Whole-to-part relationships**:

```
Plant
  NTP: Root
  NTP: Stem
  NTP: Leaf
  NTP: Flower
  NTP: Seed
```

**Test**: "X is a part of Y" or "Y includes X"

#### 3.2.3 Instance Relationships (BTI/NTI)

**Class-to-instance relationships**:

```
Medicinal Plants
  NTI: Elderberry plant at ethnobotanical garden plot A
  NTI: Sacred tobacco plant of Guarani community
```

**Test**: "X is an instance of Y" or "X is an example of Y"

#### 3.2.4 Polyhierarchy

Terms can have **multiple broader terms** in different contexts:

```
Cannabis
  BT: Medicinal Plants
  BT: Fiber Plants
  BT: Psychoactive Plants
```

### 3.3 Associative Relationships (Section 8.4)

**RT (Related Term)** connects terms with conceptual association but no hierarchical relationship:

```
Medicinal Roots
  RT: Root Preparation Methods
  RT: Traditional Medicine
  RT: Herbalism
  RT: Plant Taxonomy
```

**When to use RT**:
- Process and agent (e.g., "fermentation" RT "fermented beverages")
- Cause and effect (e.g., "toxicity" RT "poisonous plants")
- Action and product (e.g., "extraction" RT "plant extracts")
- Discipline and subject (e.g., "ethnobotany" RT "traditional ecological knowledge")
- Object and property (e.g., "plants" RT "edibility")

## 4. Notes and References (Z39.19 Section 10)

### 4.1 Scope Notes (Section 10.2)

Define **term boundaries and usage context**:

```
Term: Ayahuasca
Scope Note: Refers to both the psychoactive brew prepared from Banisteriopsis
caapi vine and Psychotria viridis leaves, and to the traditional ceremonial
context of its use in Amazonian indigenous cultures. For the plant species
themselves, see Banisteriopsis caapi and Psychotria viridis.
```

### 4.2 Definition Notes (Section 10.3)

Provide **formal definitions**:

```
Term: Ethnobotany
Definition: The scientific study of the traditional knowledge and customs of
people concerning plants and their medical, religious, and other uses.
```

### 4.3 History Notes (Section 10.4)

Document **term evolution**:

```
Term: Cassava
History Note: Previously listed as "Manioc" until 2023. Term changed to
"Cassava" based on increased usage in contemporary ethnobotanical literature
and preference expressed by source communities.
```

### 4.4 Source Notes (Bibliographic)

Provide **citations and references**:

```
Term: Sacred Tobacco
Bibliographic Note: See Wilbert, Johannes. "Tobacco and Shamanism in South
America." Yale University Press, 1987.
```

## 5. Authority Control (Z39.19 Section 9)

### 5.1 One Concept, One Term

- Each distinct concept should have **exactly one preferred term**
- All variants become non-preferred terms with USE references
- Maintain consistency across the vocabulary

### 5.2 Homograph Disambiguation

When the **same word represents different concepts**, use qualifiers:

```
Cedar (tree) - The living plant
Cedar (wood) - The material harvested from the plant
```

### 5.3 Term Status Management

Track term lifecycle:
- **Candidate**: Under review for inclusion
- **Active**: Current, approved term
- **Deprecated**: No longer used, replaced by another term

When deprecating:
```
Term: Indian Hemp (deprecated)
Replaced by: Cannabis
History Note: Term deprecated due to culturally inappropriate language.
All historical references preserved under new term.
```

## 6. Vocabulary Maintenance

### 6.1 Regular Review Cycles

- **Annual review**: Check for outdated terminology
- **Community validation**: Engage with knowledge holders
- **Literature updates**: Incorporate new research findings

### 6.2 Change Management

When modifying vocabulary:
1. Document the reason for change
2. Preserve historical information
3. Create redirects from old terms
4. Update all affected relationships
5. Notify users of significant changes

### 6.3 Quality Control

- **Reciprocity validation**: Ensure BT/NT and RT relationships are bidirectional
- **Orphan detection**: Identify unconnected terms
- **Consistency checks**: Verify term form conventions
- **Relationship logic**: Prevent circular hierarchies

## 7. Display and Presentation (Z39.19 Section 11)

### 7.1 Alphabetical Display

Standard A-Z listing with:
- Preferred terms in bold
- Non-preferred terms with USE references
- Cross-references clearly indicated

### 7.2 Hierarchical Display

Show term relationships:
```
Medicinal Plants
  . Analgesic Plants
  . . Opium Poppy
  . . Willow
  . Antimicrobial Plants
  . . Garlic
  . . Echinacea
```

### 7.3 Systematic Display (Faceted)

Group by characteristics:
```
By Plant Part:
  Roots | Stems | Leaves | Flowers | Seeds

By Usage Type:
  Medicinal | Nutritional | Ceremonial | Material

By Preparation:
  Raw | Dried | Decoction | Tincture | Poultice
```

## 8. Special Considerations for Ethnobotanical Context

### 8.1 Multilingual Terms

- Document terms in indigenous languages
- Provide pronunciation guides when possible
- Respect naming preferences of knowledge holders

### 8.2 Cultural Sensitivity

- Use terminology preferred by source communities
- Avoid culturally inappropriate or offensive terms
- Document traditional knowledge with proper attribution
- Follow CARE Principles for Indigenous Data Governance

### 8.3 Scientific vs. Traditional Names

Balance formal taxonomy with traditional nomenclature:
```
Preferred: Ayahuasca
UF: Banisteriopsis caapi (scientific name)
UF: Yagé (regional variant)
UF: Caapi
Scope Note: Traditional preparation and ceremonial context
RT: Banisteriopsis caapi (botanical species)
```

## 9. Compliance Checklist

Before releasing vocabulary updates, verify:

- [ ] All terms follow form conventions (Section 7)
- [ ] Relationships are properly typed and reciprocal (Section 8)
- [ ] Scope notes define term boundaries (Section 10.2)
- [ ] Homographs are disambiguated (Section 9)
- [ ] Deprecated terms have replacement references
- [ ] Authority control maintains one-concept-one-term principle
- [ ] Display formats support user needs (Section 11)
- [ ] Cultural sensitivity reviewed with communities
- [ ] Source attribution is complete and accurate

## References

- ANSI/NISO Z39.19-2005 (R2010). *Guidelines for the Construction, Format, and Management of Monolingual Controlled Vocabularies*. National Information Standards Organization.
- CARE Principles for Indigenous Data Governance: https://www.gida-global.org/care
- W3C SKOS Simple Knowledge Organization System: https://www.w3.org/2004/02/skos/
