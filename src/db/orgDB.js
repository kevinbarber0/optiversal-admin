const db = require('.');

class OrgDB {
  static async setConfig(organizationId, configName, configValue) {
    const values = [
      organizationId,
      '{"' + configName + '"}',
      JSON.stringify(configValue),
    ];
    await db.query(
      "UPDATE organization SET config=jsonb_set(COALESCE(config, jsonb '{}'), $2, $3, true) WHERE organization_id=$1",
      values,
    );
  }

  static async getConfig(organizationId) {
    const values = [organizationId];
    const { rows } = await db.query(
      'select config From organization WHERE organization_id=$1',
      values,
    );

    if (rows.length === 1) {
      return rows[0].config;
    }
    return null;
  }

  static async getSettings(organizationId) {
    const values = [organizationId];
    const { rows } = await db.query(
      'select settings From organization WHERE organization_id=$1',
      values,
    );

    if (rows.length === 1) {
      return rows[0].settings;
    }
    return null;
  }
}

module.exports = OrgDB;
