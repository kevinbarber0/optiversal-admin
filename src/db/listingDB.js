const db = require('.');

class ListingDB {
  static async getById(listingId) {
    const values = [listingId];
    const { rows } = await db.query(
      'SELECT l.listing_id AS "listingId", l.url, l.source_id AS "sourceId", l.last_results AS "analyticsData", l.current_listing_data as "productData" FROM listing l WHERE l.listing_id=$1',
      values,
    );
    if (!rows || rows.length !== 1) {
      return null;
    } else {
      return rows[0];
    }
  }

  static async getBySku(orgId, sku) {
    const values = [orgId, sku];
    const { rows } = await db.query(
      'SELECT l.listing_id AS "listingId", l.url, l.source_id AS "sourceId", l.last_results AS "analyticsData", l.current_listing_data as "productData" FROM listing l WHERE l.organization_id=$1 AND l.product_id=$2',
      values,
    );
    if (!rows) {
      return null;
    } else {
      return rows;
    }
  }

  static async getAll({
    orgId,
    offset,
    limit,
    filter,
    sortBy,
    marketplace,
    minQuality,
    maxQuality,
  }) {
    const values = [orgId, offset, limit];
    let valueIndex = 4;

    let query = `SELECT l.listing_id AS "listingId", l.product_id AS "productId", l.url, l.source_id AS "sourceId", l.last_results AS "analyticsData", l.current_listing_data as "productData", l.external_id AS "externalId" FROM listing l WHERE l.organization_id=$1`;

    if (filter && filter.length > 0) {
      query += ` AND (LOWER(product_id) LIKE $${valueIndex} OR LOWER((l.current_listing_data::jsonb->'productData'->'title')::text) LIKE $${valueIndex} OR LOWER((l.current_listing_data::jsonb->'source_id')::text) LIKE $${valueIndex})`;
      values.push('%' + filter.toLowerCase() + '%');
      valueIndex++;
    }

    if (minQuality) {
      query += ` AND (((l.last_results::jsonb->'score')::int) >= $${valueIndex++})`;
      values.push(minQuality);
    }
    if (maxQuality) {
      query += ` AND (((l.last_results::jsonb->'score')::int) <= $${valueIndex++})`;
      values.push(maxQuality);
    }

    if (marketplace) {
      query +=
        ' AND l.source_id IN (' +
        marketplace.map(() => `$${valueIndex++}`).join(', ') +
        ')';
      values.push(...marketplace);
    }

    query += ' ORDER BY ';
    switch (sortBy) {
      default:
      case 'lowest':
        query += `((l.last_results::jsonb->'score')::int) ASC`;
        break;
      case 'highest':
        query += `((l.last_results::jsonb->'score')::int) DESC`;
        break;
      case 'newest':
        query += 'l.date_added ASC';
        break;
      case 'oldest':
        query += 'l.date_added DESC';
        break;
      case 'title':
        query += `LOWER((l.current_listing_data::jsonb->'productData'->'title')::text) ASC`;
        break;
      case 'titlereverse':
        query += `LOWER((l.current_listing_data::jsonb->'productData'->'title')::text) DESC`;
        break;
    }

    query += ' OFFSET $2 LIMIT $3';

    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getExportData(
    orgId,
    filter,
    marketplace,
    minQuality,
    maxQuality,
  ) {
    const values = [orgId];
    let valueIndex = 2;

    let query = `SELECT l.listing_id AS "listingId", l.product_id AS "productId", l.url, l.source_id AS "sourceId", l.last_results AS "analyticsData", l.current_listing_data as "productData", l.external_id AS "externalId" FROM listing l WHERE l.organization_id=$1`;

    if (filter && filter.length > 0) {
      query += ` AND (LOWER(product_id) LIKE $${valueIndex} OR LOWER((l.current_listing_data::jsonb->'productData'->'title')::text) LIKE $${valueIndex} OR LOWER((l.current_listing_data::jsonb->'source_id')::text) LIKE $${valueIndex})`;
      values.push('%' + filter.toLowerCase() + '%');
      valueIndex++;
    }

    if (minQuality) {
      query += ` AND (((l.last_results::jsonb->'score')::int) >= $${valueIndex++})`;
      values.push(minQuality);
    }
    if (maxQuality) {
      query += ` AND (((l.last_results::jsonb->'score')::int) <= $${valueIndex++})`;
      values.push(maxQuality);
    }
    if (marketplace) {
      query +=
        ' AND l.source_id IN (' +
        marketplace.map(() => `$${valueIndex++}`).join(', ') +
        ')';
      values.push(...marketplace);
    }
    console.log('query: ', query);
    console.log('values: ', values);
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getCountAndAverage({
    orgId,
    filter,
    marketplace,
    minQuality,
    maxQuality,
  }) {
    const values = [orgId];
    let valueIndex = 2;

    let query = `SELECT COUNT(1) AS total, AVG(((l.last_results::jsonb->'score')::int)) AS "averageScore" FROM listing l WHERE l.organization_id=$1`;

    if (filter && filter.length > 0) {
      query += ` AND (LOWER(product_id) LIKE $${valueIndex} OR LOWER((l.current_listing_data::jsonb->'productData'->'title')::text) LIKE $${valueIndex} OR LOWER((l.current_listing_data::jsonb->'source_id')::text) LIKE $${valueIndex})`;
      values.push('%' + filter.toLowerCase() + '%');
      valueIndex++;
    }

    if (minQuality) {
      query += ` AND (((l.last_results::jsonb->'score')::int) >= $${valueIndex++})`;
      values.push(minQuality);
    }
    if (maxQuality) {
      query += ` AND (((l.last_results::jsonb->'score')::int) <= $${valueIndex++})`;
      values.push(maxQuality);
    }
    if (marketplace) {
      query +=
        ' AND l.source_id IN (' +
        marketplace.map(() => `$${valueIndex++}`).join(', ') +
        ')';
      values.push(...marketplace);
    }

    const { rows } = await db.query(query, values);
    if (rows && rows.length === 1) {
      return { total: rows[0].total, averageScore: rows[0].averageScore };
    }
    return { total: 0, averageScore: 0 };
  }

  static async getNextGrammarSample() {
    const { rows } = await db.query(
      'SELECT g.sample_id AS "sampleId", g.original_text AS "original", g.edited_text AS "edited", l.url FROM grammar_sample g INNER JOIN listing l ON l.listing_id=g.listing_id WHERE g.date_edited IS NULL LIMIT 1',
    );
    if (!rows || rows.length !== 1) {
      return null;
    } else {
      return rows[0];
    }
  }

  static async saveGrammarSample(sampleId, edited) {
    const values = [sampleId, edited];
    await db.query(
      'UPDATE grammar_sample SET edited_text=$2, date_edited=NOW() WHERE sample_id=$1',
      values,
    );
  }

  static async getSources(orgId) {
    const { rows } = await db.query(
      `SELECT DISTINCT l.source_id AS "sourceId" FROM listing l WHERE l.organization_id=$1`,
      [orgId],
    );
    return (rows || []).map((row) => row.sourceId);
  }
}

module.exports = ListingDB;
