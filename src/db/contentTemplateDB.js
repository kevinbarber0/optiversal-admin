const db = require('.');

class ContentTemplateDB {
  static async save(contentTemplateId, orgId, name, content, settings) {
    try {
      const values = [
        contentTemplateId,
        orgId,
        name,
        JSON.stringify(content),
        settings,
      ];
      await db.query(
        'INSERT INTO content_template (content_template_id, organization_id, name, content, settings) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (content_template_id) DO UPDATE SET name=$3, content=$4, settings=$5, date_modified=NOW()',
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async getById(contentTemplateId, orgId) {
    if (!contentTemplateId) {
      return null;
    }
    const values = [contentTemplateId, orgId];
    const { rows } = await db.query(
      'SELECT content_template_id AS "contentTemplateId", organization_id AS "organizationId", name, content, settings, date_added AS "dateAdded", date_modified AS "dateModified" FROM content_template WHERE (content_template_id=$1 OR name=$1) AND (organization_id IS NULL OR organization_id=$2)',
      values,
    );
    if (!rows || rows.length !== 1) {
      return null;
    } else {
      return rows[0];
    }
  }

  static async deleteById(contentTemplateId, orgId) {
    const values = [contentTemplateId, orgId];
    const { rows } = await db.query(
      'UPDATE content_template SET deleted=true WHERE content_template_id=$1 AND (organization_id IS NULL OR organization_id=$2)',
      values,
    );
    if (!rows || rows.length !== 1) {
      return null;
    } else {
      return rows[0];
    }
  }

  static async getAll(orgId, offset, limit) {
    const values = [orgId, offset, limit];
    const { rows } = await db.query(
      'SELECT content_template_id AS "contentTemplateId", organization_id AS "organizationId", name, date_added AS "dateAdded", date_modified AS "dateModified" FROM content_template WHERE (organization_id IS NULL OR organization_id=$1) AND deleted=false ORDER BY display_order ASC, date_modified DESC OFFSET $2 LIMIT $3',
      values,
    );
    return rows;
  }

  static async getAllWithPrefix(orgId, prefix) {
    const values = [orgId, prefix ? '%' + prefix.toLowerCase() + '%' : '%'];
    const { rows } = await db.query(
      'SELECT content_template_id AS "contentTemplateId", name FROM content_template WHERE (organization_id IS NULL OR organization_id=$1) AND deleted=false AND LOWER(name) LIKE $2 ORDER BY display_order ASC, date_modified DESC',
      values,
    );
    return rows;
  }

  static async getCount(orgId) {
    const values = [orgId];
    const { rows } = await db.query(
      'SELECT COUNT(1) AS total FROM content_template WHERE (organization_id IS NULL OR organization_id=$1) AND deleted=false',
      values,
    );
    if (rows && rows.length === 1) {
      return rows[0].total;
    }
    return 0;
  }
}

module.exports = ContentTemplateDB;
