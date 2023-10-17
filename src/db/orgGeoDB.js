const db = require('.');

class OrgGeoDB {
  static async updatedGeoLocations(orgId, locations) {
    const updateDate = new Date();

    try {
      locations.map(async (location) => {
        const values = [
          orgId,
          location.location_id,
          location.name,
          location?.city,
          location?.state,
          location?.latitude,
          location?.longitude,
          updateDate,
        ];
        console.log('values: ', values);
        await db.query(
          'INSERT INTO organization_geo (organization_id, location_id, name, city, state, latitude, longitude, date_updated) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (location_id) DO UPDATE SET organization_id=$1, name=$3, city=$4, state=$5, latitude=$6, longitude=$7, date_updated=$8',
          values,
        );
      });
    } catch (exc) {
      console.error(exc);
      return false;
    }

    await db.query(
      'DELETE FROM organization_geo WHERE organization_id=$1 AND date_updated!=$2',
      [orgId, updateDate],
    );
  }

  static async getAll(orgId) {
    const values = [orgId];
    const { rows } = await db.query(
      'SELECT location_id as "locationId", name, latitude, longitude, city, state FROM organization_geo WHERE organization_id=$1',
      values,
    );
    if (!rows) {
      return null;
    } else {
      return rows;
    }
  }
}

module.exports = OrgGeoDB;
