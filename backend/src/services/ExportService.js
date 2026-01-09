// ExportService - T056
// Export terms to CSV with UTF-8 encoding and Z39.19 standard columns

import { ObjectId } from 'mongodb';
import { getCollection } from '../shared/database.js';

/**
 * Export terms to CSV format
 */
export async function exportToCSV(filters = {}) {
  const terms = getCollection('etnotermos');
  const relationships = getCollection('etnotermos-relationships');
  const collections = getCollection('etnotermos-collections');
  const sources = getCollection('etnotermos-sources');

  // Build query
  const query = {};
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.collectionIds && filters.collectionIds.length > 0) {
    query.collectionIds = { $in: filters.collectionIds.map((id) => new ObjectId(id)) };
  }

  // Get all matching terms
  const allTerms = await terms.find(query).sort({ prefLabel: 1 }).toArray();

  // CSV headers (Z39.19 standard columns)
  const headers = [
    'term_id',
    'preferred_name',
    'language',
    'alternate_names',
    'hidden_labels',
    'scope_note',
    'definition',
    'history_note',
    'example',
    'qualifier',
    'term_type',
    'status',
    'broader_terms',
    'narrower_terms',
    'related_terms',
    'use_for',
    'use_term',
    'replaced_by',
    'collections',
    'sources',
    'created_at',
    'updated_at',
  ];

  // Build CSV rows
  const rows = await Promise.all(
    allTerms.map(async (term) => {
      // Get relationships
      const rels = await relationships
        .find({
          $or: [{ sourceTermId: term._id }, { targetTermId: term._id }],
        })
        .toArray();

      const broaderTerms = [];
      const narrowerTerms = [];
      const relatedTerms = [];

      for (const rel of rels) {
        if (rel.sourceTermId.toString() === term._id.toString()) {
          if (rel.type === 'BT' || rel.type === 'BTG' || rel.type === 'BTP' || rel.type === 'BTI') {
            const targetTerm = await terms.findOne({ _id: rel.targetTermId });
            if (targetTerm) broaderTerms.push(targetTerm.prefLabel);
          } else if (rel.type === 'RT') {
            const targetTerm = await terms.findOne({ _id: rel.targetTermId });
            if (targetTerm) relatedTerms.push(targetTerm.prefLabel);
          }
        } else {
          if (rel.type === 'NT' || rel.type === 'NTG' || rel.type === 'NTP' || rel.type === 'NTI') {
            const sourceTerm = await terms.findOne({ _id: rel.sourceTermId });
            if (sourceTerm) narrowerTerms.push(sourceTerm.prefLabel);
          }
        }
      }

      // Get collection names
      const collectionNames = [];
      if (term.collectionIds && term.collectionIds.length > 0) {
        for (const colId of term.collectionIds) {
          const col = await collections.findOne({ _id: colId });
          if (col) collectionNames.push(col.name);
        }
      }

      // Get source citations
      const sourceCitations = [];
      if (term.sourceIds && term.sourceIds.length > 0) {
        for (const srcId of term.sourceIds) {
          const src = await sources.findOne({ _id: srcId });
          if (src) {
            const citation = formatSourceCitation(src);
            sourceCitations.push(citation);
          }
        }
      }

      // Build row
      return [
        term._id.toString(),
        escapeCsvField(term.prefLabel),
        'pt', // Language
        escapeCsvField((term.altLabels || []).join('|')),
        escapeCsvField((term.hiddenLabels || []).join('|')),
        escapeCsvField(term.scopeNote || ''),
        escapeCsvField(term.definition || ''),
        escapeCsvField(term.historyNote || ''),
        escapeCsvField(term.example || ''),
        escapeCsvField(term.qualifier || ''),
        term.termType || 'preferred',
        term.status || 'active',
        escapeCsvField(broaderTerms.join('|')),
        escapeCsvField(narrowerTerms.join('|')),
        escapeCsvField(relatedTerms.join('|')),
        escapeCsvField((term.useFor || []).length.toString()),
        term.useTerm ? term.useTerm.toString() : '',
        term.replacedBy ? term.replacedBy.toString() : '',
        escapeCsvField(collectionNames.join('|')),
        escapeCsvField(sourceCitations.join('|')),
        term.createdAt ? term.createdAt.toISOString() : '',
        term.updatedAt ? term.updatedAt.toISOString() : '',
      ];
    })
  );

  // Combine headers and rows
  const csvLines = [headers.join(','), ...rows.map((row) => row.join(','))];

  return csvLines.join('\n');
}

/**
 * Format source citation for CSV export
 */
function formatSourceCitation(source) {
  switch (source.type) {
    case 'bibliographic':
      return `${source.fields.author || 'Unknown'}. ${source.fields.title || 'Untitled'}. ${source.fields.year || 'n.d.'}`;
    case 'interview':
      return `Interview with ${source.fields.interviewee || 'Unknown'} (${source.fields.date || 'n.d.'})`;
    case 'field_notes':
      return `Field notes (${source.fields.date || 'n.d.'}, ${source.fields.location || 'unknown location'})`;
    case 'herbarium_sample':
      return `Herbarium sample ${source.fields.sampleId || 'Unknown'}`;
    default:
      return 'Unknown source';
  }
}

/**
 * Escape CSV field (handle quotes, commas, newlines)
 */
function escapeCsvField(field) {
  if (!field) return '';

  const stringField = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
}

/**
 * Export to SKOS RDF/XML format (future enhancement)
 */
export async function exportToSKOS(filters = {}) {
  // Placeholder for SKOS export
  throw new Error('SKOS export not yet implemented');
}

export default {
  exportToCSV,
  exportToSKOS,
};
