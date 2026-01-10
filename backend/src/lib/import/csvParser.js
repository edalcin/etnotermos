// CSV Import Parser for EtnoTermos
// Parses CSV files with Z39.19 standard format and validates data

import { parse } from 'csv-parse/sync';

/**
 * Expected CSV format (Z39.19 standard):
 * term_id,preferred_name,alternate_names,scope_note,definition,broader_terms,narrower_terms,related_terms,use_for,collections,sources,language
 */

const REQUIRED_HEADERS = ['preferred_name'];
const OPTIONAL_HEADERS = [
  'term_id',
  'alternate_names',
  'hidden_labels',
  'scope_note',
  'definition',
  'historical_note',
  'example',
  'qualifier',
  'term_type',
  'status',
  'broader_terms',
  'narrower_terms',
  'related_terms',
  'use_for',
  'use_term',
  'collections',
  'sources',
  'language',
  'facets'
];

/**
 * Parse CSV file content into term objects
 * @param {string|Buffer} fileContent - CSV file content
 * @param {Object} options - Parse options
 * @returns {Object} { terms: Array, errors: Array, warnings: Array }
 */
export function parseCSV(fileContent, options = {}) {
  const results = {
    terms: [],
    errors: [],
    warnings: []
  };

  try {
    // Parse CSV with proper UTF-8 encoding
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle UTF-8 BOM
      encoding: 'utf-8',
      ...options
    });

    // Validate headers
    if (records.length === 0) {
      results.errors.push({
        row: 0,
        field: 'file',
        message: 'CSV file is empty'
      });
      return results;
    }

    const headers = Object.keys(records[0]);
    const missingRequired = REQUIRED_HEADERS.filter(h => !headers.includes(h));

    if (missingRequired.length > 0) {
      results.errors.push({
        row: 0,
        field: 'headers',
        message: `Missing required headers: ${missingRequired.join(', ')}`
      });
      return results;
    }

    // Parse each record
    records.forEach((record, index) => {
      const rowNum = index + 2; // +2 for header and 1-indexed

      try {
        const term = parseTerm(record, rowNum, results);
        if (term) {
          results.terms.push(term);
        }
      } catch (error) {
        results.errors.push({
          row: rowNum,
          field: 'record',
          message: error.message
        });
      }
    });

  } catch (error) {
    results.errors.push({
      row: 0,
      field: 'file',
      message: `CSV parsing error: ${error.message}`
    });
  }

  return results;
}

/**
 * Parse a single term record
 * @param {Object} record - CSV record
 * @param {number} rowNum - Row number for error reporting
 * @param {Object} results - Results object to accumulate warnings
 * @returns {Object|null} Parsed term object or null if validation fails
 */
function parseTerm(record, rowNum, results) {
  // Required fields
  if (!record.preferred_name || record.preferred_name.trim() === '') {
    results.errors.push({
      row: rowNum,
      field: 'preferred_name',
      message: 'preferred_name is required'
    });
    return null;
  }

  const term = {
    prefLabel: record.preferred_name.trim(),
    termType: record.term_type || 'preferred',
    status: record.status || 'active',
  };

  // Optional ID (for updates)
  if (record.term_id) {
    term._id = record.term_id.trim();
  }

  // Parse array fields (pipe-separated)
  term.altLabels = parseArrayField(record.alternate_names);
  term.hiddenLabels = parseArrayField(record.hidden_labels);

  // Text fields
  if (record.definition) term.definition = record.definition.trim();
  if (record.scope_note) term.scopeNote = record.scope_note.trim();
  if (record.historical_note) term.historyNote = record.historical_note.trim();
  if (record.example) term.example = record.example.trim();
  if (record.qualifier) term.qualifier = record.qualifier.trim();

  // Relationship fields (will be processed separately)
  if (record.broader_terms) {
    term._relationships = term._relationships || {};
    term._relationships.BT = parseArrayField(record.broader_terms);
  }
  if (record.narrower_terms) {
    term._relationships = term._relationships || {};
    term._relationships.NT = parseArrayField(record.narrower_terms);
  }
  if (record.related_terms) {
    term._relationships = term._relationships || {};
    term._relationships.RT = parseArrayField(record.related_terms);
  }
  if (record.use_for) {
    term._relationships = term._relationships || {};
    term._relationships.UF = parseArrayField(record.use_for);
  }
  if (record.use_term) {
    term.useTerm = record.use_term.trim();
  }

  // Collections (pipe-separated IDs or names)
  if (record.collections) {
    term._collections = parseArrayField(record.collections);
  }

  // Sources (pipe-separated IDs or citations)
  if (record.sources) {
    term._sources = parseArrayField(record.sources);
  }

  // Facets (JSON string)
  if (record.facets) {
    try {
      term.facets = JSON.parse(record.facets);
    } catch (error) {
      results.warnings.push({
        row: rowNum,
        field: 'facets',
        message: 'Invalid JSON in facets field, skipping'
      });
    }
  }

  // Language (for multilingual support)
  if (record.language) {
    term.language = record.language.trim();
  }

  // Validation warnings
  if (term.prefLabel.length > 200) {
    results.warnings.push({
      row: rowNum,
      field: 'preferred_name',
      message: 'Preferred name exceeds 200 characters'
    });
  }

  if (term.altLabels.length > 50) {
    results.warnings.push({
      row: rowNum,
      field: 'alternate_names',
      message: 'More than 50 alternate names'
    });
  }

  return term;
}

/**
 * Parse pipe-separated field into array
 * @param {string} field - Pipe-separated string
 * @returns {Array} Array of trimmed values
 */
function parseArrayField(field) {
  if (!field || field.trim() === '') {
    return [];
  }

  return field
    .split('|')
    .map(item => item.trim())
    .filter(item => item !== '');
}

/**
 * Validate parsed terms for Z39.19 compliance
 * @param {Array} terms - Array of parsed terms
 * @returns {Object} { valid: Array, invalid: Array, conflicts: Array }
 */
export function validateTerms(terms) {
  const validation = {
    valid: [],
    invalid: [],
    conflicts: []
  };

  const prefLabelMap = new Map();

  terms.forEach((term, index) => {
    const errors = [];

    // Check for duplicate preferred names in import
    if (prefLabelMap.has(term.prefLabel.toLowerCase())) {
      validation.conflicts.push({
        term,
        index,
        type: 'duplicate_import',
        message: `Duplicate preferred name "${term.prefLabel}" in import file (rows ${prefLabelMap.get(term.prefLabel.toLowerCase()) + 2} and ${index + 2})`,
        conflictWith: terms[prefLabelMap.get(term.prefLabel.toLowerCase())]
      });
    } else {
      prefLabelMap.set(term.prefLabel.toLowerCase(), index);
    }

    // Validate term type
    const validTermTypes = ['preferred', 'entry', 'deprecated'];
    if (!validTermTypes.includes(term.termType)) {
      errors.push(`Invalid term_type "${term.termType}" (must be: preferred, entry, or deprecated)`);
    }

    // Validate status
    const validStatuses = ['active', 'deprecated', 'candidate'];
    if (!validStatuses.includes(term.status)) {
      errors.push(`Invalid status "${term.status}" (must be: active, deprecated, or candidate)`);
    }

    // Z39.19: Entry terms must have useTerm
    if (term.termType === 'entry' && !term.useTerm) {
      errors.push('Entry terms must specify a use_term (preferred term)');
    }

    // Z39.19: Preferred terms should not have useTerm
    if (term.termType === 'preferred' && term.useTerm) {
      errors.push('Preferred terms cannot have a use_term');
    }

    if (errors.length > 0) {
      validation.invalid.push({
        term,
        index,
        errors
      });
    } else {
      validation.valid.push(term);
    }
  });

  return validation;
}

/**
 * Generate CSV template with headers and example data
 * @returns {string} CSV template
 */
export function generateTemplate() {
  const headers = [
    'term_id',
    'preferred_name',
    'alternate_names',
    'hidden_labels',
    'scope_note',
    'definition',
    'historical_note',
    'example',
    'qualifier',
    'term_type',
    'status',
    'broader_terms',
    'narrower_terms',
    'related_terms',
    'use_for',
    'use_term',
    'collections',
    'sources',
    'language',
    'facets'
  ];

  const example = [
    'term_001',
    'Jaborandi',
    'Pilocarpus jaborandi|arruda-do-mato',
    'jaborandi plant',
    'Utilizada principalmente para extração de pilocarpina',
    'Planta medicinal nativa da Mata Atlântica',
    'Conhecida desde o século XIX',
    'As folhas de jaborandi são coletadas para produção de medicamentos',
    '',
    'preferred',
    'active',
    'Plantas medicinais',
    'Pilocarpus microphyllus|Pilocarpus pennatifolius',
    'Mata Atlântica|Extração sustentável',
    'arruda-brava',
    '',
    'Plantas Medicinais|Flora Brasileira',
    'Silva, J.M. 2020|IBGE 2019',
    'portuguese',
    '{"plantPart":"folha","usageType":"medicinal","region":"Mata Atlântica"}'
  ];

  const rows = [headers, example];
  return rows.map(row => row.map(escapeCSV).join(',')).join('\n');
}

/**
 * Escape CSV field (wrap in quotes if contains special characters)
 * @param {string} field - Field value
 * @returns {string} Escaped field
 */
function escapeCSV(field) {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export default {
  parseCSV,
  validateTerms,
  generateTemplate
};
