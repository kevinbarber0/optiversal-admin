const db = require('.');

class AccountTokenDB {
  static async isTokenUsed(token) {
    if (token) {
      const values = [token];
      const { rows } = await db.query(
        'SELECT token FROM account_token where token=$1',
        values,
      );
      if (!rows || rows.length !== 1) {
        return false;
      } else {
        return true;
      }
    }
    return false;
  }

  static async setTokenUsed(token) {
    const values = [token];
    await db.query('INSERT INTO account_token (token) VALUES($1)', values);
  }
}

module.exports = AccountTokenDB;
