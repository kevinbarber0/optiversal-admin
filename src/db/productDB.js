const { getProductQueryWhere } = require('@helpers/workflow');
const db = require('.');

class ProductDB {
  static async getAllSkus(orgId, prefix) {
    const values = [orgId, `%${prefix.toLowerCase()}%`];
    const { rows } = await db.query(
      'SELECT DISTINCT sku, name FROM product WHERE organization_id=$1 AND (LOWER(sku) LIKE $2 OR LOWER(name) LIKE $2) LIMIT 100',
      values,
    );
    return rows;
  }

  static async getProducts(orgId, keyword, max) {
    const values = [orgId, `%${keyword.toLowerCase()}%`];
    const { rows } = await db.query(
      'SELECT sku, name, image_url AS "imageUrl", url FROM product WHERE organization_id=$1 AND (LOWER(sku) LIKE $2 OR LOWER(name) LIKE $2) ORDER BY COALESCE(image_url, \'zzzzz\') LIMIT ' +
        max,
      values,
    );
    return rows;
  }

  static async getProductWithContent(orgId, sku) {
    const values = [orgId, sku];
    const { rows } = await db.query(
      'SELECT sku, name, image_url AS "imageUrl", url, description, features, category_id AS "categoryId", family_ids AS "familyIds", content, review_analysis AS "reviewAnalysis" FROM product WHERE organization_id=$1 AND sku=$2',
      values,
    );
    if (rows && rows.length === 1) {
      return rows[0];
    }
    return null;
  }

  static async getProductContent(orgId, skus) {
    if (!skus || skus.length < 1) {
      return [];
    }
    const values = [orgId];
    let q =
      "SELECT sku, content FROM product WHERE organization_id=$1 AND sku IN ('adkjflsjfdfdj'";
    for (let i = 0; i < skus.length; i++) {
      values.push(skus[i]);
      q += ', $' + (i + 2);
    }
    q += ')';
    const { rows } = await db.query(q, values);
    return rows;
  }

  static async getProductPageContent(orgId, skus) {
    if (!skus || skus.length < 1) {
      return [];
    }
    const values = [orgId];
    let q =
      "SELECT sku, page_content AS content FROM product WHERE organization_id=$1 AND sku IN ('adkjflsjfdfdj'";
    for (let i = 0; i < skus.length; i++) {
      values.push(skus[i]);
      q += ', $' + (i + 2);
    }
    q += ')';
    const { rows } = await db.query(q, values);
    return rows;
  }

  static async setProductPageContent(orgId, sku, key, value) {
    const values = [orgId, sku, '{"' + key + '"}', JSON.stringify(value)];
    const { rows } = await db.query(
      "UPDATE product SET page_content=jsonb_set(COALESCE(page_content, jsonb '{}'), $3, $4, true) WHERE organization_id=$1 AND sku=$2",
      values,
    );
    return rows;
  }

  static async setProductContent(orgId, sku, key, value) {
    const values = [orgId, sku, '{"' + key + '"}', JSON.stringify(value)];
    const { rows } = await db.query(
      "UPDATE product SET content=jsonb_set(COALESCE(content, jsonb '{}'), $3, $4, true) WHERE organization_id=$1 AND sku=$2",
      values,
    );
    return rows;
  }

  static async addProductContent(orgId, sku, key, contentId, value) {
    let values = [orgId, sku];
    await db.query(
      "UPDATE product SET content='{}'::jsonb WHERE organization_id=$1 AND sku=$2 AND content IS NULL",
      values,
    );
    values = [orgId, sku, '{"' + key + '"}', JSON.stringify({})];
    await db.query(
      "UPDATE product SET content=jsonb_set(COALESCE(content, jsonb '{}'), $3, $4, true) WHERE organization_id=$1 AND sku=$2 AND NOT content ? '" +
        key +
        "'",
      values,
    );
    values = [
      orgId,
      sku,
      '{"' + key + '", "' + contentId + '"}',
      JSON.stringify({ content: value, translations: {} }),
    ];
    await db.query(
      "UPDATE product SET content=jsonb_set(COALESCE(content, jsonb '{}'), $3, $4, true) WHERE organization_id=$1 AND sku=$2",
      values,
    );
  }

  static async getProductsInCategories(orgId, categoryIds) {
    const values = [orgId];
    let q =
      "SELECT name, MIN(sku) AS sku FROM product WHERE organization_id=$1 AND category_id IN ('" +
      categoryIds.join("','") +
      "') GROUP BY name";
    console.log(q);
    const { rows } = await db.query(q, values);
    return rows;
  }

  static async setTranslation(
    organization_id,
    sku,
    type,
    contentId,
    languageCode,
    data,
  ) {
    const values = [
      organization_id,
      sku,
      '{"' +
        type +
        '", "' +
        contentId +
        '", "translations", "' +
        languageCode +
        '"}',
      data,
    ];
    const { rows } = await db.query(
      'UPDATE product SET content=jsonb_set(content, $3, $4, true) WHERE organization_id=$1 AND sku=$2',
      values,
    );
    return rows;
  }

  static async getProductsByFilter(
    organizationId,
    {
      offset,
      limit,
      keyword,
      categories,
      includedFilters,
      missingContent,
      minLowestQuality,
      maxLowestQuality,
    },
  ) {
    let query = `SELECT p.sku, p.image_url, p.name, c.name AS category, count(1) OVER() AS "productCount", p.labels  FROM product p LEFT JOIN category c ON p.category_id = c.external_id WHERE 1=1`;
    let params = [offset, limit];

    const queryWhere = getProductQueryWhere(
      organizationId,
      {
        categories,
        attributes: includedFilters,
        missingContent,
        minLowestQuality,
        maxLowestQuality,
      },
      3,
    );

    query += ' AND ' + queryWhere.query;
    params.push(...queryWhere.params);
    if (keyword && keyword.length > 0) {
      params.push(`%${(keyword || '').toLowerCase()}%`);
      query += ` AND (LOWER(p.sku) LIKE $${params.length} OR LOWER(p.name) LIKE $${params.length})`;
    }
    if (organizationId === '9b5711e85') {
      query +=
        ' ORDER BY p.image_url IS NULL ASC, p.review_analysis IS NULL ASC, p.sku OFFSET $1 LIMIT $2';
    } else {
      query += ' ORDER BY p.sku OFFSET $1 LIMIT $2';
    }
    const { rows } = await db.query(query, params);
    return rows;
  }

  static async getProductsCountByFilter(
    organizationId,
    {
      keyword,
      categories,
      includedFilters,
      missingContent,
      minLowestQuality,
      maxLowestQuality,
    },
  ) {
    let query =
      'SELECT COUNT(1) AS total FROM product p WHERE (LOWER(sku) LIKE $1 OR LOWER(name) LIKE $1)';
    let params = [`%${(keyword || '').toLowerCase()}%`];

    const queryWhere = getProductQueryWhere(
      organizationId,
      {
        categories,
        attributes: includedFilters,
        missingContent,
        minLowestQuality,
        maxLowestQuality,
      },
      2,
    );

    query += ' AND ' + queryWhere.query;
    params.push(...queryWhere.params);

    const { rows } = await db.query(query, params);
    if (rows && rows.length === 1) {
      return rows[0].total;
    }
    return 0;
  }

  static async setLabels(sku, orgId, labels) {
    const values = [sku, orgId, JSON.stringify(labels)];
    await db.query(
      'UPDATE product SET labels=$3 WHERE sku=$1 AND organization_id=$2',
      values,
    );
  }
}

module.exports = ProductDB;
