# Data Model: EtnoTerms

**Date**: 2025-09-28
**Phase**: 1 - Design
**Database**: MongoDB with Mongoose ODM

## Entity Relationship Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      User       │    │      Term       │    │ BibliographicSrc│
│                 │    │                 │    │                 │
│ - id            │    │ - id            │    │ - id            │
│ - googleId      │────│ - createdBy     │    │ - title         │
│ - email         │    │ - updatedBy     │    │ - authors       │
│ - roles[]       │    │ - title         │    │ - year          │
│ - profile       │    │ - definitions[] │    │ - doi           │
└─────────────────┘    │ - notes[]       │    │ - journal       │
                       │ - sources[]     │────│ - metadata      │
┌─────────────────┐    │ - relationships │    └─────────────────┘
│   Relationship  │────│ - categories[]  │
│                 │    │ - culturalCtx   │    ┌─────────────────┐
│ - fromTermId    │    │ - languages[]   │    │      Note       │
│ - toTermId      │    │ - auditLog[]    │    │                 │
│ - type          │    └─────────────────┘    │ - id            │
│ - metadata      │                           │ - type          │
│ - createdBy     │    ┌─────────────────┐    │ - content       │
│ - createdAt     │    │   Collection    │    │ - termId        │
└─────────────────┘    │                 │    │ - sources[]     │
                       │ - id            │    │ - createdBy     │
┌─────────────────┐    │ - name          │    │ - visibility    │
│    AuditLog     │    │ - description   │    └─────────────────┘
│                 │    │ - terms[]       │
│ - id            │    │ - createdBy     │    ┌─────────────────┐
│ - entityType    │    │ - permissions   │    │     APIKey      │
│ - entityId      │    └─────────────────┘    │                 │
│ - action        │                           │ - id            │
│ - changes       │                           │ - key           │
│ - userId        │                           │ - name          │
│ - timestamp     │                           │ - permissions   │
│ - metadata      │                           │ - rateLimit     │
└─────────────────┘                           │ - expiresAt     │
                                              └─────────────────┘
```

## Core Entities

### Term
**Purpose**: Central entity representing ethnobotanical concepts
**Collections**: `terms`

```javascript
{
  _id: ObjectId,
  title: {
    primary: String,           // Primary term name
    variants: [String],        // Alternative names/spellings
    languages: [{              // Multilingual support
      code: String,            // ISO language code
      name: String,            // Term in that language
      script: String           // Writing system if applicable
    }]
  },
  definitions: [{
    text: String,              // Definition text
    language: String,          // Language code
    context: String,           // Cultural/academic context
    sourceId: ObjectId,        // Reference to BibliographicSource
    createdBy: ObjectId,       // User who added definition
    createdAt: Date
  }],
  categories: [{
    type: {                    // Term classification
      type: String,
      enum: ['meta', 'generic', 'specific', 'related', 'preferred'],
      required: true
    },
    hierarchy: Number,         // Hierarchical level (0 = root)
    parentId: ObjectId         // Reference to parent term
  }],
  culturalContext: {
    communities: [String],     // Traditional communities associated
    regions: [String],         // Geographic regions
    usageContext: String,      // Traditional usage context
    sensitivity: {             // Cultural sensitivity indicators
      level: {
        type: String,
        enum: ['public', 'restricted', 'sacred'],
        default: 'public'
      },
      restrictions: String,    // Usage restrictions if any
      consentGiven: Boolean,   // Community consent documented
      reviewedBy: ObjectId     // Community leader who reviewed
    }
  },
  metadata: {
    status: {
      type: String,
      enum: ['draft', 'under_review', 'published', 'archived'],
      default: 'draft'
    },
    visibility: {
      type: String,
      enum: ['public', 'authenticated', 'role_restricted'],
      default: 'authenticated'
    },
    searchable: {
      type: Boolean,
      default: true
    }
  },
  createdBy: ObjectId,         // User reference
  updatedBy: ObjectId,         // Last modifier
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}

// Indexes
{
  "title.primary": "text",
  "title.variants": "text",
  "definitions.text": "text"
}
{
  "categories.type": 1,
  "categories.hierarchy": 1
}
{
  "culturalContext.communities": 1,
  "culturalContext.regions": 1
}
{
  "metadata.status": 1,
  "createdAt": -1
}
```

### Relationship
**Purpose**: Many-to-many connections between terms
**Collections**: `relationships`

```javascript
{
  _id: ObjectId,
  fromTermId: ObjectId,       // Source term
  toTermId: ObjectId,         // Target term
  type: {
    type: String,
    enum: [
      'broader',              // Hierarchical: broader concept
      'narrower',             // Hierarchical: narrower concept
      'related',              // Associative relationship
      'equivalent',           // Synonym/equivalent term
      'translationOf',        // Cross-language equivalence
      'partOf',               // Meronymic relationship
      'hasPart',              // Holonymic relationship
      'usedWith',             // Co-occurrence relationship
      'replacedBy',           // Temporal replacement
      'replaces'              // Temporal precedence
    ],
    required: true
  },
  properties: {
    strength: {               // Relationship strength (0.0-1.0)
      type: Number,
      min: 0,
      max: 1,
      default: 1
    },
    context: String,          // Contextual description
    evidence: String,         // Supporting evidence
    confidence: {             // Confidence level
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  sources: [ObjectId],        // Supporting bibliographic sources
  bidirectional: {            // Whether relationship is symmetric
    type: Boolean,
    default: false
  },
  createdBy: ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
{
  "fromTermId": 1,
  "toTermId": 1,
  "type": 1
}
{
  "fromTermId": 1,
  "type": 1
}
{
  "bidirectional": 1,
  "type": 1
}
```

### Note
**Purpose**: Contextual annotations for terms
**Collections**: `notes`

```javascript
{
  _id: ObjectId,
  termId: ObjectId,           // Associated term
  type: {
    type: String,
    enum: [
      'scope',                // Definition scope note
      'cataloger',            // Cataloger's note
      'historical',           // Historical context
      'bibliographic',        // Bibliographic note
      'private',              // Private/internal note
      'definition',           // Definition note
      'example'               // Usage example
    ],
    required: true
  },
  content: {
    text: String,             // Note content
    language: String,         // Language code
    format: {                 // Content format
      type: String,
      enum: ['plain', 'markdown', 'html'],
      default: 'plain'
    }
  },
  visibility: {
    type: String,
    enum: ['public', 'authenticated', 'role_restricted', 'private'],
    default: 'authenticated'
  },
  sources: [ObjectId],        // Supporting sources
  metadata: {
    tags: [String],           // Categorization tags
    priority: {               // Display priority
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    reviewStatus: {
      type: String,
      enum: ['draft', 'under_review', 'approved', 'rejected'],
      default: 'draft'
    }
  },
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
{
  "termId": 1,
  "type": 1
}
{
  "content.text": "text"
}
{
  "visibility": 1,
  "metadata.reviewStatus": 1
}
```

### BibliographicSource
**Purpose**: Academic citations and references
**Collections**: `bibliographic_sources`

```javascript
{
  _id: ObjectId,
  type: {
    type: String,
    enum: ['journal', 'book', 'chapter', 'thesis', 'conference', 'web', 'other'],
    required: true
  },
  citation: {
    title: String,            // Publication title
    authors: [{               // Author information
      firstName: String,
      lastName: String,
      middleName: String,
      suffix: String,
      orcid: String           // ORCID identifier
    }],
    editors: [{               // For edited volumes
      firstName: String,
      lastName: String,
      middleName: String
    }],
    publication: {
      journal: String,        // Journal name
      volume: String,         // Volume number
      issue: String,          // Issue number
      pages: String,          // Page range
      publisher: String,      // Publisher name
      location: String,       // Publication location
      year: Number,           // Publication year
      month: String           // Publication month
    },
    identifiers: {
      doi: String,            // Digital Object Identifier
      isbn: String,           // International Standard Book Number
      issn: String,           // International Standard Serial Number
      pmid: String,           // PubMed ID
      url: String             // Web URL
    }
  },
  abstract: String,           // Publication abstract
  keywords: [String],         // Subject keywords
  language: String,           // Publication language
  accessInfo: {
    openAccess: Boolean,      // Open access status
    license: String,          // Usage license
    accessDate: Date,         // Date accessed (for web sources)
    archiveUrl: String        // Archived version URL
  },
  metadata: {
    addedBy: ObjectId,        // User who added source
    verifiedBy: ObjectId,     // User who verified citation
    quality: {                // Source quality rating
      type: String,
      enum: ['high', 'medium', 'low', 'unverified'],
      default: 'unverified'
    },
    relevance: {              // Relevance to ethnobotany
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
{
  "citation.title": "text",
  "citation.authors.lastName": "text",
  "keywords": "text"
}
{
  "citation.identifiers.doi": 1
}
{
  "type": 1,
  "citation.publication.year": -1
}
```

### User
**Purpose**: System users with role-based access
**Collections**: `users`

```javascript
{
  _id: ObjectId,
  authentication: {
    googleId: String,         // Google OAuth identifier
    email: String,            // Primary email address
    emailVerified: Boolean,   // Email verification status
    lastLogin: Date,          // Last login timestamp
    loginCount: Number        // Total login count
  },
  profile: {
    firstName: String,
    lastName: String,
    displayName: String,      // Preferred display name
    avatar: String,           // Profile image URL
    institution: String,      // Academic institution
    department: String,       // Department/division
    position: String,         // Job title/position
    orcid: String,            // ORCID researcher ID
    bio: String,              // Professional biography
    specializations: [String], // Research specializations
    languages: [String]       // Spoken/working languages
  },
  roles: [{
    type: {
      type: String,
      enum: ['admin', 'researcher', 'student', 'community_leader'],
      required: true
    },
    level: {                  // Permission level within role
      type: String,
      enum: ['basic', 'advanced', 'full'],
      default: 'basic'
    },
    grantedBy: ObjectId,      // Admin who granted role
    grantedAt: Date,          // When role was granted
    expiresAt: Date           // Role expiration (optional)
  }],
  permissions: {
    canCreateTerms: Boolean,
    canEditTerms: Boolean,
    canDeleteTerms: Boolean,
    canManageUsers: Boolean,
    canExportData: Boolean,
    canAccessPrivateNotes: Boolean,
    maxApiCalls: Number       // API rate limit
  },
  preferences: {
    language: String,         // Interface language
    timezone: String,         // User timezone
    notifications: {
      email: Boolean,
      inApp: Boolean
    },
    culturalSensitivity: {    // Cultural awareness settings
      showWarnings: Boolean,
      requestPermission: Boolean
    }
  },
  statistics: {
    termsCreated: Number,
    notesAdded: Number,
    relationshipsCreated: Number,
    lastActivity: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
{
  "authentication.googleId": 1
}
{
  "authentication.email": 1
}
{
  "roles.type": 1,
  "status": 1
}
```

### Collection
**Purpose**: Grouped sets of terms for organization
**Collections**: `collections`

```javascript
{
  _id: ObjectId,
  name: String,               // Collection name
  description: String,        // Collection description
  type: {
    type: String,
    enum: ['project', 'region', 'community', 'topic', 'temporal'],
    required: true
  },
  terms: [ObjectId],          // Associated terms
  metadata: {
    region: String,           // Geographic region
    community: String,        // Traditional community
    timeframe: {              // Temporal scope
      start: Date,
      end: Date
    },
    language: String,         // Primary language
    culturalContext: String   // Cultural background
  },
  access: {
    visibility: {
      type: String,
      enum: ['public', 'authenticated', 'restricted', 'private'],
      default: 'authenticated'
    },
    permissions: [{           // User-specific permissions
      userId: ObjectId,
      level: {
        type: String,
        enum: ['view', 'edit', 'admin'],
        required: true
      }
    }]
  },
  statistics: {
    termCount: Number,
    contributorCount: Number,
    lastUpdate: Date
  },
  createdBy: ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
{
  "type": 1,
  "access.visibility": 1
}
{
  "terms": 1
}
{
  "createdBy": 1,
  "createdAt": -1
}
```

### APIKey
**Purpose**: External system authentication
**Collections**: `api_keys`

```javascript
{
  _id: ObjectId,
  keyHash: String,            // Hashed API key (bcrypt)
  name: String,               // Descriptive name
  description: String,        // Purpose description
  owner: {
    userId: ObjectId,         // Owner user ID
    organization: String,     // Organization name
    contact: String           // Contact information
  },
  permissions: {
    scopes: [{                // Permission scopes
      type: String,
      enum: ['read:terms', 'write:terms', 'read:search', 'read:export', 'admin:users'],
      required: true
    }],
    rateLimit: {
      requests: Number,       // Requests per window
      window: Number,         // Window in milliseconds
      burst: Number           // Burst allowance
    },
    ipRestrictions: [String], // Allowed IP addresses/ranges
    domainRestrictions: [String] // Allowed domains
  },
  usage: {
    totalRequests: Number,
    lastUsed: Date,
    monthlyUsage: [{
      month: String,          // YYYY-MM format
      requests: Number,
      errors: Number
    }]
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'revoked'],
    default: 'active'
  },
  expiresAt: Date,            // Key expiration
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
{
  "keyHash": 1
}
{
  "owner.userId": 1
}
{
  "status": 1,
  "expiresAt": 1
}
```

### AuditLog
**Purpose**: Complete audit trail for all system changes
**Collections**: `audit_logs`

```javascript
{
  _id: ObjectId,
  entityType: {
    type: String,
    enum: ['term', 'note', 'relationship', 'source', 'user', 'collection'],
    required: true
  },
  entityId: ObjectId,         // ID of affected entity
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'view', 'export'],
    required: true
  },
  changes: {                  // Detailed change information
    before: Schema.Types.Mixed, // Previous state
    after: Schema.Types.Mixed,  // New state
    fields: [String],         // Changed field names
    summary: String           // Human-readable summary
  },
  actor: {
    userId: ObjectId,         // User who performed action
    type: {
      type: String,
      enum: ['user', 'system', 'api'],
      required: true
    },
    apiKeyId: ObjectId,       // If action via API
    ipAddress: String,        // Source IP address
    userAgent: String         // Client user agent
  },
  context: {
    sessionId: String,        // Session identifier
    requestId: String,        // Request identifier
    source: {                 // Source of the action
      type: String,
      enum: ['web', 'api', 'import', 'migration'],
      required: true
    },
    culturalReview: {         // Cultural sensitivity review
      required: Boolean,
      completed: Boolean,
      reviewedBy: ObjectId
    }
  },
  timestamp: { type: Date, default: Date.now, index: true },
  retention: {
    category: {               // Retention category
      type: String,
      enum: ['operational', 'academic', 'legal', 'cultural'],
      default: 'operational'
    },
    deleteAfter: Date         // Automatic deletion date
  }
}

// Indexes
{
  "entityType": 1,
  "entityId": 1,
  "timestamp": -1
}
{
  "actor.userId": 1,
  "timestamp": -1
}
{
  "action": 1,
  "timestamp": -1
}
```

## Data Validation Rules

### Term Validation
- `title.primary` required, min 2 characters, max 200 characters
- At least one definition required for published terms
- Cultural sensitivity level must be validated by community leaders for restricted/sacred terms
- Hierarchical relationships must not create cycles
- Maximum 5 levels of hierarchy depth

### Relationship Validation
- Cannot create self-referencing relationships (fromTermId ≠ toTermId)
- Bidirectional relationships automatically create reverse relationship
- Hierarchical relationships (broader/narrower) must maintain tree structure
- Maximum 50 relationships per term to prevent performance issues

### Note Validation
- Private notes only accessible to creator and admins
- Bibliographic notes must reference valid sources
- Content length limits by type (scope: 500 chars, example: 1000 chars, etc.)

### Cultural Sensitivity Validation
- Sacred/restricted terms require community leader approval
- Consent documentation required for traditional knowledge
- Attribution must include community and contributor information
- Review workflow for culturally sensitive content

## Performance Considerations

### Indexing Strategy
- Text search indexes on all searchable fields
- Compound indexes for common query patterns
- Sparse indexes for optional fields
- TTL indexes for temporary data (sessions, tokens)

### Aggregation Pipelines
- Term relationship graphs cached for complex queries
- Collection statistics computed incrementally
- Cultural context facets pre-computed for search filters

### Data Archival
- Automatic archival of old audit logs (>2 years)
- Soft delete for terms (status change vs. physical deletion)
- Version history for critical entities

---

**Data model complete. Ready for contract generation.**