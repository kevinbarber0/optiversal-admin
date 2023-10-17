import { v4 as uuidv4 } from 'uuid';
const db = require('.');
const { compareArray } = require('@helpers/utils');

class ContentLabelDB {
  static async findOrCreateSubscription(accountId, frequency, labels) {
    let queryValues = [accountId, frequency];
    let { rows } = await db.query(
      'SELECT labels AS "labels" FROM content_label_subscription WHERE account_id=$1 AND frequency=$2',
      queryValues,
    );

    if (rows && rows.length === 1) {
      queryValues = [accountId, frequency, JSON.stringify(labels)];

      if (!compareArray(labels, rows[0].labels)) {
        await db.query(
          'Update content_label_subscription SET labels=$3 WHERE account_id=$1 AND frequency=$2',
          queryValues,
        );
      }
    } else if (rows && rows.length > 1) {
      console.log(
        `multiple records with accountId: ${accountId}, frequency: ${frequency}`,
      );
      throw new Error('Invalid record');
    } else {
      queryValues = [uuidv4(), accountId, frequency, JSON.stringify(labels)];
      await db.query(
        'INSERT INTO content_label_subscription(subscription_id, account_id, frequency, labels, date_added) VALUES ($1, $2, $3, $4, NOW())',
        queryValues,
      );
    }

    return true;
  }

  static async findSubscriptionByAccountId(accountId) {
    if (accountId) {
      const queryValues = [accountId];
      const { rows } = await db.query(
        `SELECT cls.labels AS "labels", cls.frequency as "frequency" FROM content_label_subscription cls WHERE cls.account_id=$1`,
        queryValues,
      );
      if (rows) {
        return rows.reduce(
          (acc, { frequency, labels }) => ({ ...acc, [frequency]: labels }),
          {},
        );
      } else {
        return null;
      }
    }
    return null;
  }
}

module.exports = ContentLabelDB;
