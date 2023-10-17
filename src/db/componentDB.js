const db = require('.');

class ComponentDB {
  static async save(componentId, orgId, name, settings) {
    try {
      const values = [componentId, orgId, name, settings];
      await db.query(
        'INSERT INTO component (component_id, organization_id, name, settings) VALUES ($1, $2, $3, $4) ON CONFLICT (component_id) DO UPDATE SET name=$3, settings=$4, date_modified=NOW()',
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async getWorkflowComponents(orgId) {
    const values = [orgId];
    const { rows } = await db.query(
      'SELECT component_id AS "componentId", organization_id AS "organizationId", name, settings, date_added AS "dateAdded", date_modified AS "dateModified" FROM component WHERE (allow_workflow=true) AND (organization_id IS NULL OR organization_id=$1)',
      values,
    );
    return rows;
  }

  static async getById(componentId, orgId) {
    if (!componentId) {
      return null;
    }
    const values = [componentId, orgId];
    const { rows } = await db.query(
      'SELECT component_id AS "componentId", organization_id AS "organizationId", name, settings, date_added AS "dateAdded", date_modified AS "dateModified" FROM component WHERE (component_id=$1 OR name=$1) AND (organization_id IS NULL OR organization_id=$2)',
      values,
    );
    if (!rows || rows.length !== 1) {
      return null;
    } else {
      return rows[0];
    }
  }

  static async deleteById(componentId, orgId) {
    const values = [componentId, orgId];
    const { rows } = await db.query(
      'UPDATE component SET deleted=true WHERE component_id=$1 AND (organization_id IS NULL OR organization_id=$2)',
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
      'SELECT component_id AS "componentId", organization_id AS "organizationId", name, settings, date_added AS "dateAdded", date_modified AS "dateModified", display_group AS "displayGroup", description FROM component WHERE (organization_id IS NULL OR organization_id=$1) AND deleted=false ORDER BY display_order ASC, date_modified DESC OFFSET $2 LIMIT $3',
      values,
    );
    return rows;
  }

  static async getCount(orgId) {
    const values = [orgId];
    const { rows } = await db.query(
      'SELECT COUNT(1) AS total FROM component WHERE (organization_id IS NULL OR organization_id=$1) AND deleted=false',
      values,
    );
    if (rows && rows.length === 1) {
      return rows[0].total;
    }
    return 0;
  }
}

module.exports = ComponentDB;
