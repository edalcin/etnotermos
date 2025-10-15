# Phase 1: Data Model

This document defines the data model for the EtnoTermos system based on the entities identified in `spec.md`. The schemas are described in a format that can be easily translated to Mongoose schemas for MongoDB.

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

Represents a single ethnobotanical term. This is the core entity of the system.

- `_id`: string (unique identifier)
- `prefLabel`: string (The preferred name for the term)
- `altLabels`: array of strings (Synonyms or alternative names)
- `definition`: string
- `scopeNote`: string
- `historyNote`: string
- `example`: string
- `sourceIds`: array of refs (References to Source entities)
- `collectionIds`: array of refs (References to Collection entities)
- `createdAt`: date
- `updatedAt`: date
- `createdBy`: ref (User ID)

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

Defines a semantic relationship between two terms.

- `_id`: string (unique identifier)
- `sourceTermId`: ref (The origin term)
- `targetTermId`: ref (The destination term)
- `type`: string (Enum: `broader`, `narrower`, `related`, `synonym`)
- `createdAt`: date
- `createdBy`: ref (User ID)

## 7. APIKey

Authentication token for external systems.

- `_id`: string (unique identifier)
- `key`: string (The generated API key, should be hashed in DB)
- `description`: string
- `permissions`: array of strings (e.g., `read:terms`, `search`)
- `lastUsed`: date
- `createdAt`: date
- `createdBy`: ref (User ID)
