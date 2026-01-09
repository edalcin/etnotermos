// Z39.19 Validation Utilities - T049
// ANSI/NISO Z39.19-2005 compliance validation functions

import { getCollection } from '../../shared/database.js';
import { RelationshipType, getReciprocalType, isHierarchical } from '../../models/Relationship.js';

/**
 * Validate relationship reciprocity (Z39.19 requirement)
 * For every relationship A→B of type X, there must exist B→A of reciprocal type
 */
export async function validateRelationshipReciprocity(sourceTermId, targetTermId, type) {
  const relationships = getCollection('etnotermos-relationships');

  // Get expected reciprocal type
  const expectedReciprocalType = getReciprocalType(type);

  // Check if reciprocal relationship exists
  const reciprocal = await relationships.findOne({
    sourceTermId: targetTermId,
    targetTermId: sourceTermId,
    type: expectedReciprocalType,
  });

  if (!reciprocal) {
    return {
      valid: false,
      error: `Reciprocal relationship not found. Expected ${targetTermId}→${sourceTermId} of type ${expectedReciprocalType}`,
    };
  }

  return { valid: true, reciprocal };
}

/**
 * Detect circular hierarchies (Z39.19 Section 8.3)
 * Hierarchical relationships (BT/NT) must not form cycles
 */
export async function detectCircularHierarchy(sourceTermId, targetTermId, type) {
  // Only check for hierarchical relationships
  if (!isHierarchical(type)) {
    return { valid: true };
  }

  const relationships = getCollection('etnotermos-relationships');

  // Build hierarchy graph and detect cycles using DFS
  const visited = new Set();
  const recursionStack = new Set();

  async function hasCycle(currentTermId) {
    if (recursionStack.has(currentTermId.toString())) {
      return true; // Cycle detected
    }

    if (visited.has(currentTermId.toString())) {
      return false; // Already processed
    }

    visited.add(currentTermId.toString());
    recursionStack.add(currentTermId.toString());

    // Get all hierarchical relationships where this term is the source
    const hierarchicalTypes = ['BT', 'BTG', 'BTP', 'BTI']; // Upward relationships
    const edges = await relationships
      .find({
        sourceTermId: currentTermId,
        type: { $in: hierarchicalTypes },
      })
      .toArray();

    for (const edge of edges) {
      if (await hasCycle(edge.targetTermId)) {
        return true;
      }
    }

    recursionStack.delete(currentTermId.toString());
    return false;
  }

  // Start DFS from target term, see if we can reach source term
  // This would create a cycle if the new relationship is added
  visited.clear();
  recursionStack.clear();

  const wouldCreateCycle = await hasCycle(targetTermId);

  if (wouldCreateCycle) {
    return {
      valid: false,
      error: 'Creating this relationship would form a circular hierarchy, which violates Z39.19 standards',
    };
  }

  return { valid: true };
}

/**
 * Validate authority control (Z39.19 Section 6)
 * Only one preferred term per concept (enforced by unique index on prefLabel)
 */
export async function validateAuthorityControl(prefLabel, excludeTermId = null) {
  const terms = getCollection('etnotermos');

  const query = { prefLabel };
  if (excludeTermId) {
    query._id = { $ne: excludeTermId };
  }

  const existingTerm = await terms.findOne(query);

  if (existingTerm) {
    return {
      valid: false,
      error: `A term with preferred label "${prefLabel}" already exists. Z39.19 requires one preferred term per concept.`,
      existingTermId: existingTerm._id,
    };
  }

  return { valid: true };
}

/**
 * Validate homograph qualifier (Z39.19 Section 7.5)
 * Homographs (same spelling, different meaning) require qualifiers
 */
export function validateHomographQualifier(prefLabel, qualifier, definition) {
  // Check if term looks like it might need a qualifier
  // Common indicators: short generic terms without context
  const needsQualifierPattern = /^[A-Za-zÀ-ÿ]{1,15}$/; // Short single word

  if (needsQualifierPattern.test(prefLabel.trim()) && !qualifier && !definition) {
    return {
      valid: false,
      warning:
        'Short generic terms should have either a qualifier (e.g., "Plant (tree)" vs "Plant (organ)") or a clear definition to avoid ambiguity.',
    };
  }

  return { valid: true };
}

/**
 * Validate USE/UF relationship consistency (Z39.19 Section 8.2)
 * Entry terms (USE) must point to preferred terms (UF)
 */
export async function validateUseRelationshipConsistency(sourceTermId, targetTermId, type) {
  if (type !== RelationshipType.USE && type !== RelationshipType.UF) {
    return { valid: true };
  }

  const terms = getCollection('etnotermos');

  const [sourceTerm, targetTerm] = await Promise.all([
    terms.findOne({ _id: sourceTermId }),
    terms.findOne({ _id: targetTermId }),
  ]);

  if (!sourceTerm || !targetTerm) {
    return { valid: false, error: 'One or both terms not found' };
  }

  // USE relationship: source should be entry term, target should be preferred
  if (type === RelationshipType.USE) {
    if (sourceTerm.termType === 'preferred') {
      return {
        valid: false,
        error:
          'USE relationships should point FROM entry terms TO preferred terms. Source term is already preferred.',
      };
    }
    if (targetTerm.termType !== 'preferred') {
      return {
        valid: false,
        error: 'USE relationships must point to a preferred term. Target term is not preferred.',
      };
    }
  }

  // UF relationship: source should be preferred, target should be entry
  if (type === RelationshipType.UF) {
    if (sourceTerm.termType !== 'preferred') {
      return {
        valid: false,
        error: 'UF (Used For) relationships must originate from a preferred term.',
      };
    }
    if (targetTerm.termType === 'preferred') {
      return {
        valid: false,
        error:
          'UF (Used For) relationships should point to entry terms, not other preferred terms.',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate relationship semantics (Z39.19 Section 8)
 * Ensure relationship makes semantic sense
 */
export function validateRelationshipSemantics(type, sourceLabel, targetLabel) {
  // This is a placeholder for more sophisticated semantic validation
  // Could be enhanced with natural language processing

  // Basic check: BT/NT relationships should not be between identical or very similar terms
  if (type === RelationshipType.BT || type === RelationshipType.NT) {
    if (sourceLabel.toLowerCase() === targetLabel.toLowerCase()) {
      return {
        valid: false,
        error: 'A term cannot have a broader/narrower relationship with itself',
      };
    }
  }

  return { valid: true };
}

/**
 * Comprehensive relationship validation
 * Runs all Z39.19 validation checks
 */
export async function validateRelationshipFull(sourceTermId, targetTermId, type) {
  // 1. Check for circular hierarchies
  const circularCheck = await detectCircularHierarchy(sourceTermId, targetTermId, type);
  if (!circularCheck.valid) {
    return circularCheck;
  }

  // 2. Check USE/UF consistency
  const useConsistencyCheck = await validateUseRelationshipConsistency(
    sourceTermId,
    targetTermId,
    type
  );
  if (!useConsistencyCheck.valid) {
    return useConsistencyCheck;
  }

  return { valid: true };
}

export default {
  validateRelationshipReciprocity,
  detectCircularHierarchy,
  validateAuthorityControl,
  validateHomographQualifier,
  validateUseRelationshipConsistency,
  validateRelationshipSemantics,
  validateRelationshipFull,
};
