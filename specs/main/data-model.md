# Phase 1: Data Model

This document defines the data model for the EtnoTermos system, based on the entities identified in the feature specification. The schemas are described using JSON Schema, which can be used to validate data in the MongoDB database.

## Core Entities

### 1. Term

Represents a single ethnobotanical term.

**JSON Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Term",
  "description": "An ethnobotanical term or concept.",
  "type": "object",
  "properties": {
    "_id": { "type": "string", "description": "Unique identifier (e.g., UUID)" },
    "prefLabel": { "type": "string", "description": "The preferred label for the term." },
    "altLabels": { 
      "type": "array", 
      "items": { "type": "string" },
      "description": "Alternative labels or synonyms."
    },
    "definition": { "type": "string", "description": "A concise definition of the term." },
    "scopeNote": { "type": "string", "description": "A note about the scope and usage of the term." },
    "historyNote": { "type": "string", "description": "A note about the history of the term." },
    "example": { "type": "string", "description": "An example of the term's usage." },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  },
  "required": ["_id", "prefLabel", "createdAt", "updatedAt"]
}
```

### 2. Note

Represents a note associated with a term.

**JSON Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Note",
  "description": "A note associated with a term.",
  "type": "object",
  "properties": {
    "_id": { "type": "string" },
    "termId": { "type": "string", "description": "The ID of the term this note is associated with." },
    "type": {
      "type": "string",
      "enum": ["scope", "cataloger", "historical", "bibliographic", "private", "definition", "example"]
    },
    "content": { "type": "string" },
    "authorId": { "type": "string", "description": "The ID of the user who created the note." },
    "isPrivate": { "type": "boolean", "default": false },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  },
  "required": ["_id", "termId", "type", "content", "authorId", "createdAt", "updatedAt"]
}
```

### 3. Relationship

Represents a relationship between two terms.

**JSON Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Relationship",
  "description": "A relationship between two terms.",
  "type": "object",
  "properties": {
    "_id": { "type": "string" },
    "sourceTermId": { "type": "string" },
    "targetTermId": { "type": "string" },
    "type": { 
      "type": "string", 
      "enum": ["broader", "narrower", "related"] 
    },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  },
  "required": ["_id", "sourceTermId", "targetTermId", "type", "createdAt", "updatedAt"]
}
```

### 4. User

Represents a user of the system.

**JSON Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "properties": {
    "_id": { "type": "string" },
    "googleId": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "name": { "type": "string" },
    "role": { 
      "type": "string", 
      "enum": ["admin", "researcher", "student", "community_leader"] 
    },
    "createdAt": { "type": "string", "format": "date-time" }
  },
  "required": ["_id", "googleId", "email", "name", "role", "createdAt"]
}
```