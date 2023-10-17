const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PWD,
  port: 5432,
});

const readOnlyPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST_READ_ONLY || process.env.DB_HOST,// Fallback to write DB if read only DB is not set
  database: process.env.DB_DATABASE,
  password: process.env.DB_PWD,
  port: 5432,
});

module.exports = {
  query: async (text, params, callback) => {
    return await pool.query(text, params, callback);
  },
  queryReadOnly: async (text, params, callback) => {
    return await readOnlyPool.query(text, params, callback);
  }
};
