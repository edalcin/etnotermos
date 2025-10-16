# Phase 1: Data Model

This document defines the data model for the EtnoTermos system based on the entities identified in `spec.md`. The schemas are described in a format that can be easily translated to Mongoose schemas for MongoDB.

**Standards Compliance**: This data model follows ANSI/NISO Z39.19-2005 (R2010) guidelines for controlled vocabulary construction, including:
- Section 6: Term Selection principles
- Section 7: Term Form conventions
- Section 8: Relationship structures (equivalence, hierarchical, and associative)
- Section 10: Notes and references
- Section 11: Display and presentation formats

## 1. User

Represents a user of the system, authenticated via Google.

- `_id`: string (unique identifier)
- `googleId`: string (Google's unique user ID)
- `email`: string (User's email)
- `name`: string (User's full name)
- `role`: string (Enum: `admin`, `researcher`, `student`, `community_leader`)
- `createdAt`: date

## 2. Source

Represents the origin of information. This is a flexible entity to accommodate various source types.

- `_id`: string (unique identifier)
- `type`: string (Enum: `bibliographic`, `interview`, `field_notes`, `herbarium_sample`)
- `fields`: object (A flexible object to store type-specific fields. E.g., for `bibliographic`: `{ author, title, year }`; for `interview`: `{ interviewee, date }`)
- `createdAt`: date
- `createdBy`: ref (User ID)

## 3. Collection

Acts as a simple tag to group terms thematically.

- `_id`: string (unique identifier)
- `name`: string (The name of the collection, e.g., "Medicinal Plants")
- `description`: string (Optional description)

## 4. Term

Represents a single ethnobotanical term. This is the core entity of the system, following ANSI-NISO Z39.19 vocabulary structure.

- `_id`: string (unique identifier)
- `prefLabel`: string (The preferred name for the term - Z39.19 Section 8.2)
- `altLabels`: array of strings (Synonyms or alternative names - non-preferred terms)
- `hiddenLabels`: array of strings (Search terms not displayed to users)
- `definition`: string (Formal definition - Z39.19 Section 10.3)
- `scopeNote`: string (Usage context and boundaries - Z39.19 Section 10.2)
- `historyNote`: string (Term evolution and changes - Z39.19 Section 10.4)
- `example`: string (Usage examples - Z39.19 Section 10.5)
- `qualifier`: string (Disambiguation qualifier for homographs, e.g., "(tree)", "(wood)")
- `termType`: string (Enum: `preferred`, `entry`, `deprecated` - Z39.19 Section 8.2)
- `status`: string (Enum: `active`, `deprecated`, `candidate`)
- `useFor`: array of refs (Entry terms that redirect to this preferred term)
- `useTerm`: ref (For entry terms, reference to the preferred term - Z39.19 USE reference)
- `facets`: object (Faceted classification fields, e.g., `{ plantPart: "root", usageType: "medicinal" }`)
- `sourceIds`: array of refs (References to Source entities)
- `collectionIds`: array of refs (References to Collection entities)
- `createdAt`: date
- `updatedAt`: date
- `createdBy`: ref (User ID)
- `deprecatedDate`: date (When term was deprecated, if applicable)
- `replacedBy`: ref (Term ID that replaces this deprecated term)

## 5. Note

Contextual information attached to a term.

- `_id`: string (unique identifier)
- `termId`: ref (The term this note is associated with)
- `type`: string (Enum: `scope`, `cataloger`, `historical`, `bibliographic`, `private`, `definition`, `example`)
- `content`: string
- `sourceIds`: array of refs (References to Source entities that back up this note)
- `isPrivate`: boolean (Defaults to false. If true, only visible to author and admins)
- `authorId`: ref (User ID)
- `createdAt`: date

## 6. Relationship

Defines a semantic relationship between two terms, following ANSI-NISO Z39.19 Section 8 (Relationships).

**Relationship Types (Z39.19 Classification)**:

1. **Equivalence Relationships** (Section 8.2):
   - `USE`: Points from non-preferred term to preferred term
   - `UF` (Used For): Points from preferred term to non-preferred terms

2. **Hierarchical Relationships** (Section 8.3):
   - `BT` (Broader Term): Points to more general term
   - `NT` (Narrower Term): Points to more specific term
   - `BTG` (Broader Term Generic): Generic-specific relationship
   - `NTG` (Narrower Term Generic): Specific-generic relationship
   - `BTP` (Broader Term Partitive): Whole-part relationship
   - `NTP` (Narrower Term Partitive): Part-whole relationship
   - `BTI` (Broader Term Instance): Class-instance relationship
   - `NTI` (Narrower Term Instance): Instance-class relationship

3. **Associative Relationships** (Section 8.4):
   - `RT` (Related Term): Associative connection between terms

**Schema**:
- `_id`: string (unique identifier)
- `sourceTermId`: ref (The origin term)
- `targetTermId`: ref (The destination term)
- `type`: string (Enum: `USE`, `UF`, `BT`, `NT`, `BTG`, `NTG`, `BTP`, `NTP`, `BTI`, `NTI`, `RT`)
- `reciprocalType`: string (Automatically computed reciprocal relationship type)
- `isReciprocal`: boolean (Whether this relationship should be automatically reciprocated)
- `createdAt`: date
- `createdBy`: ref (User ID)
- `validatedAt`: date (When relationship reciprocity was last validated)

## 7. APIKey

Authentication token for external systems.

- `_id`: string (unique identifier)
- `key`: string (The generated API key, should be hashed in DB)
- `description`: string
- `permissions`: array of strings (e.g., `read:terms`, `search`)
- `lastUsed`: date
- `createdAt`: date
- `createdBy`: ref (User ID)
