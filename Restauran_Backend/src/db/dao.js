const pool = require("./mysql.config");

/**
 * Core query function using prepared statements
 * @param {string} sql - The SQL statement with '?' placeholders
 * @param {Array} params - Values to bind to placeholders
 */
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error(`[DB Error] Query failed: ${sql}`, error.message);
    throw error;
  }
};

/**
 * Fetch multiple records
 * @returns {Promise<Array>} List of rows
 */
const getAll = async (sql, params = []) => {
  return await query(sql, params);
};

/**
 * Fetch a single record
 * @returns {Promise<Object|null>} First matching row or null if not found
 */
const getOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Insert a new record
 * @returns {Promise<number>} ID of the newly inserted row
 */
const insert = async (sql, params = []) => {
  const result = await query(sql, params);
  return result.insertId;
};

/**
 * Update or Delete records
 * @returns {Promise<number>} Number of affected rows
 */
const execute = async (sql, params = []) => {
  const result = await query(sql, params);
  return result.affectedRows;
};

/**
 * Execute multiple queries inside a database transaction
 * Automatically rolls back on failure and releases connection
 */
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error("[DB Error] Transaction rolled back:", error.message);
    throw error;
  } finally {
    connection.release(); // Return connection back to pool
  }
};

module.exports = {
  query,
  getAll,
  getOne,
  insert,
  execute,
  transaction,
};