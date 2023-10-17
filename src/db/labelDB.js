const db = require('.');

class LabelDB {
  static async ensure(orgId, label) {
    const values = [label, orgId];
    await db.query(
      'INSERT INTO content_label (label, organization_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      values,
    );
  }

  static async getAll(orgId, filter = '') {
    const values = [orgId, filter ? '%' + filter.toLowerCase() + '%' : '%'];
    const { rows } = await db.query(
      'SELECT label FROM content_label WHERE organization_id=$1 AND LOWER(label) LIKE $2 ORDER BY label',
      values,
    );
    if (rows) {
      return rows.map((r) => r.label);
    }
    return [];
  }
}

module.exports = LabelDB;
