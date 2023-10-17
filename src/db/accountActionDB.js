import { v4 as uuidv4 } from 'uuid';
const db = require('.');

class AccountActionDB {
  static async createAccountAction({
    orgId,
    accountId,
    accountEmail,
    actionDetails,
  }) {
    try {
      await db.query(
        `INSERT INTO account_action(account_action_id, organization_id, account_id, account_email, action_details, date_added) VALUES($1, $2, $3, $4, $5::jsonb, NOW())`,
        [uuidv4(), orgId, accountId, accountEmail, actionDetails],
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async getAll(
    orgId,
    { offset, limit, filter, sortBy, accounts, actionTypes, dateRange },
  ) {
    let query = `SELECT aa.account_action_id AS "accountActionId", aa.organization_id AS "organizationId", aa.account_id AS "accountId", aa.account_email AS "accountEmail", aa.action_details AS "actionDetails", aa.date_added AS "dateAdded" FROM account_action aa WHERE aa.organization_id = $1`;
    const values = [orgId, offset, limit];
    let valueIndex = 4;

    if (filter) {
      const filterIndex = valueIndex++;
      query += ` AND (LOWER((aa.action_details::jsonb->'description')::text) LIKE $${filterIndex} OR LOWER((aa.action_details::jsonb->'itemName')::text) LIKE $${filterIndex})`;
      values.push(`%${filter.toLowerCase()}%`);
    }

    if (accounts) {
      query += ` AND aa.account_email IN (${accounts
        .map(() => `$${valueIndex++}`)
        .join(', ')})`;
      values.push(...accounts);
    }
    if (actionTypes) {
      query += ` AND aa.action_details->>'actionType' IN (${actionTypes
        .map(() => `$${valueIndex++}`)
        .join(', ')})`;
      values.push(...actionTypes);
    }
    if (dateRange) {
      query += ` AND aa.date_added >= $${valueIndex++} AND aa.date_added <= $${valueIndex++}`;
      values.push(
        dateRange[0] + ' 00:00:00.000',
        dateRange[1] + ' 23:59:59.999',
      );
    }
    query += ` ORDER BY date_added ${
      sortBy === 'newest' ? 'desc' : 'asc'
    } OFFSET $2 LIMIT $3 `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getCount(
    orgId,
    { offset, limit, filter, accounts, actionTypes, dateRange },
  ) {
    let query = `SELECT COUNT(1) AS total FROM account_action aa WHERE aa.organization_id = $1`;
    const values = [orgId];
    let valueIndex = 2;

    if (filter) {
      const filterIndex = valueIndex++;
      query += ` AND (LOWER((aa.action_details::jsonb->'description')::text) LIKE $${filterIndex} OR LOWER((aa.action_details::jsonb->'itemName')::text) LIKE $${filterIndex})`;
      values.push(`%${filter.toLowerCase()}%`);
    }

    if (accounts) {
      query += ` AND aa.account_email IN (${accounts
        .map(() => `$${valueIndex++}`)
        .join(', ')})`;
      values.push(...accounts);
    }
    if (actionTypes) {
      query += ` AND aa.action_details->>'actionType' IN (${actionTypes
        .map(() => `$${valueIndex++}`)
        .join(', ')})`;
      values.push(...actionTypes);
    }
    if (dateRange) {
      query += ` AND aa.date_added >= $${valueIndex++} AND aa.date_added <= $${valueIndex++}`;
      values.push(
        dateRange[0] + ' 00:00:00.000',
        dateRange[1] + ' 23:59:59.999',
      );
    }

    const { rows } = await db.query(query, values);
    if (rows && rows.length === 1) {
      return rows[0].total;
    }
    return 0;
  }
}

module.exports = AccountActionDB;
