import { v4 as uuidv4 } from 'uuid';
const db = require('.');
class ListingAnalysisDB {
  static async create(url) {
    const id = uuidv4();
    const values = [id, url];
    await db.query(
      'INSERT INTO listing_analysis (listing_analysis_id, url) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      values,
    );
    return id;
  }

  static async getById(id) {
    if (id) {
      const values = [id];
      const { rows } = await db.query(
        'SELECT url, progress,listing_data FROM listing_analysis WHERE listing_analysis_id=$1',
        values,
      );
      if (!rows || rows.length !== 1) {
        return null;
      } else {
        return rows[0];
      }
    } else {
      return null;
    }
  }

  static async updateProgress(id, progress) {
    const values = [id, JSON.stringify(progress)];
    await db.query(
      'UPDATE listing_analysis SET progress=($2::jsonb) WHERE listing_analysis_id=$1',
      values,
    );
  }

  static async updateData(id, data) {
    const dbData = Object.assign({}, data);
    delete dbData.rawHTML;
    const values = [id, JSON.stringify(dbData)];
    await db.query(
      'UPDATE listing_analysis SET listing_data=($2::jsonb) WHERE listing_analysis_id=$1',
      values,
    );
  }
}

module.exports = ListingAnalysisDB;
