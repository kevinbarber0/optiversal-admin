const db = require('.');

class QueryDB {
  static async getAllCategories(orgId, prefix) {
    const values = [orgId, `%${(prefix || '').toLowerCase()}%`];
    const { rows } = await db.query(
      'SELECT DISTINCT c.external_id AS "categoryId", c.name FROM category c WHERE c.organization_id=$1 AND (LOWER(c.external_id) LIKE $2 OR LOWER(c.name) LIKE $2) LIMIT 100',
      values,
    );
    return rows;
  }

  static async getCategoryByIds(orgId, categoryIds) {
    const values = [orgId, ...categoryIds];
    let offset = 2;
    const { rows } = await db.query(
      'SELECT DISTINCT c.external_id AS "categoryId", c.name FROM category c WHERE c.organization_id=$1 AND c.external_id IN (' +
        categoryIds.map(() => `$${offset++}`).join(', ') +
        ')',
      values,
    );

    console.log('query', values);
    return rows;
  }

  static async getPopulatedCategories(orgId) {
    const values = [orgId];
    const { rows } = await db.query(
      'SELECT DISTINCT c.external_id AS "categoryId", c.name FROM category c WHERE c.organization_id=$1 AND EXISTS (SELECT 1 FROM product p WHERE p.organization_id=c.organization_id AND p.category_id=c.external_id)',
      values,
    );
    return rows;
  }

  static async getAllFeatureNames(prefix) {
    const values = [`%${(prefix || '').toLowerCase()}%`];
    const { rows } = await db.query(
      'SELECT DISTINCT f.feature FROM feature_expression fe INNER JOIN feature f ON fe.feature_id=f.feature_id WHERE LOWER(fe.expression) LIKE $1 UNION SELECT DISTINCT f.feature FROM feature f WHERE LOWER(f.feature) LIKE $1 LIMIT 100',
      values,
    );
    return rows;
  }

  static async getAllCustomAttributes(orgId, prefix) {
    const values = [orgId, `%${(prefix || '').toLowerCase()}%`];
    const { rows } = await db.query(
      'SELECT name, data_type AS "dataType", values from custom_attribute WHERE (organization_id=$1 OR organization_id=\'global\') AND LOWER(name) LIKE $2 ORDER BY name',
      values,
    );
    return rows;
  }
}

module.exports = QueryDB;
