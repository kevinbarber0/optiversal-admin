import { v4 as uuidv4 } from 'uuid';
const db = require('.');

class UsageDB {
  static async save(
    organizationId,
    authorId,
    contentType,
    context,
    sku,
    settings,
    output,
    completion,
  ) {
    try {
      let wordCount = 0;
      if (completion) {
        wordCount = completion
          .split(' ')
          .filter((w) => w.trim().length > 0).length;
      }
      const values = [
        uuidv4(),
        organizationId,
        authorId,
        contentType,
        context,
        sku,
        settings,
        output,
        completion,
        wordCount,
      ];
      await db.query(
        'INSERT INTO usage (usage_id, organization_id, author_id, content_type, context, sku, settings, output, completion_text, words, date_added) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())',
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }
}

module.exports = UsageDB;
