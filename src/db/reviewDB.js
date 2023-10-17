const db = require('.');

class ReviewDB {
  static async getProcessedReviewIds(orgId) {
    const values = [orgId];
    const { rows } = await db.query(
      'SELECT review_id FROM review WHERE organization_id=$1 AND analyzed=true',
      values,
    );
    return rows;
  }

  static async addFamilyGroup(orgId, familyGroup, reviewCount) {
    const values = [orgId, familyGroup, reviewCount];
    const { rows } = await db.query(
      'INSERT INTO family_group (organization_id, family_ids, review_count) VALUES ($1, $2, $3) ON CONFLICT (organization_id, family_ids) DO UPDATE SET review_count=$3, date_modified=NOW()',
      values,
    );
    return rows;
  }

  static async getReviewAnnotations(orgId, reviewId) {
    const values = [orgId, reviewId];
    const { rows } = await db.query(
      'SELECT review_id as "reviewId", annotations FROM review WHERE organization_id=$1 and review_id=$2',
      values,
    );
    if (!rows || rows.length !== 1) {
      return null;
    } else {
      return rows[0];
    }
  }

  static async setReviewAnnotations(orgId, reviewId, annotations, accountId) {
    try {
      const values = [orgId, reviewId, annotations, accountId];
      await db.query(
        'INSERT INTO review (organization_id, review_id, annotations, annotated_by, date_annotated) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (review_id, organization_id) DO UPDATE SET annotations=$3, annotated_by=$4, date_annotated=NOW()',
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }
}

module.exports = ReviewDB;
