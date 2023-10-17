const db = require('.');

class ConceptDB {
  static async getAllConcepts(prefix = '') {
    const values = [`%${prefix.toLowerCase()}%`];
    const { rows } = await db.query(
      'SELECT DISTINCT c.concept_id AS "conceptId", c.name FROM concept c INNER JOIN concept_expression ce ON c.concept_id=ce.concept_id WHERE LOWER(ce.expression) LIKE $1 LIMIT 100',
      values,
    );
    return rows;
  }

  static async getChildConcepts(parentConceptId) {
    const values = [parentConceptId];
    const { rows } = await db.query(
      'SELECT DISTINCT c.concept_id AS "conceptId", c.name FROM concept c INNER JOIN concept_relationship cr ON c.concept_id =cr.from_concept_id WHERE cr.to_concept_id=$1',
      values,
    );
    return rows;
  }

  static async getConceptById(conceptId) {
    const values = [conceptId];
    const { rows } = await db.query(
      'SELECT c.concept_id AS "conceptId", c.name, c.lemma FROM concept c WHERE c.concept_id=$1',
      values,
    );
    if (rows && rows.length === 1) {
      const concept = rows[0];
      const parentConcept = await ConceptDB.getParentConcept(conceptId);
      if (parentConcept) {
        concept.parentConcept = parentConcept.name;
        concept.parentConceptId = parentConcept.conceptId;
      }
      return concept;
    } else {
      return null;
    }
  }

  static async getParentConcept(conceptId) {
    const values = [conceptId];
    const { rows } = await db.query(
      'SELECT c.concept_id AS conceptId, c.name FROM concept c INNER JOIN concept_relationship cr ON c.concept_id = cr.to_concept_id WHERE from_concept_id=$1',
      values,
    );
    if (rows && rows.length === 1) {
      return rows[0];
    } else {
      return null;
    }
  }

  static async getConceptInsights(conceptId) {
    const values = [conceptId];
    const { rows } = await db.query(
      'SELECT insights FROM concept WHERE concept_id=$1',
      values,
    );
    if (rows && rows.length === 1) {
      return rows[0].insights;
    } else {
      return null;
    }
  }

  static async setConceptInsights(conceptId, key, value) {
    const values = [conceptId, '{"' + key + '"}', JSON.stringify(value)];
    const { rows } = await db.query(
      "UPDATE concept SET insights=jsonb_set(COALESCE(insights, jsonb '{}'), $2, $3, true) WHERE concept_id=$1",
      values,
    );
    return rows;
  }
}

module.exports = ConceptDB;
