/**
 * Database Service — op-sqlite wrapper for local transaction storage
 *
 * Features:
 * - SQLite via JSI (high performance)
 * - Duplicate detection via sms_hash UNIQUE constraint
 * - Today's transactions and total queries
 *
 * op-sqlite result format:
 *   result = { insertId, rowsAffected, rows: { _array: [...], length, item(i) } }
 *   For RN 0.79 + op-sqlite v11, rows can also be accessed as result.rows._array
 *   We handle both formats for safety.
 */

import {open} from '@op-engineering/op-sqlite';

let db = null;

/**
 * Safely extract rows array from op-sqlite result
 * op-sqlite may return rows in different formats depending on version
 */
function getRows(result) {
  if (!result) {
    return [];
  }
  // op-sqlite v9+ returns { rows: { _array: [...] } }
  if (result.rows && result.rows._array) {
    return result.rows._array;
  }
  // op-sqlite v7-v8 returns { rows: [...] } directly
  if (Array.isArray(result.rows)) {
    return result.rows;
  }
  // Some versions return rows with .item() method
  if (result.rows && typeof result.rows.item === 'function' && result.rows.length > 0) {
    const arr = [];
    for (let i = 0; i < result.rows.length; i++) {
      arr.push(result.rows.item(i));
    }
    return arr;
  }
  return [];
}

/**
 * Initialize the database and create tables
 */
export function initDB() {
  if (db) {
    return db;
  }

  db = open({
    name: 'upi_tracker.db',
  });

  db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      sms_hash TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Create index on date for faster daily queries
  db.execute(`
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  `);

  return db;
}

/**
 * Insert a transaction into the database
 * Skips duplicates silently if sms_hash already exists
 *
 * @param {number} amount - Transaction amount
 * @param {string} category - Expense category
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {string|null} smsHash - Unique SMS hash for dedup (null for manual entries)
 * @returns {boolean} - true if inserted, false if duplicate
 */
export function insertTransaction(amount, category, date, smsHash = null) {
  try {
    initDB();

    if (smsHash) {
      // Use INSERT OR IGNORE to silently skip duplicates
      const result = db.execute(
        'INSERT OR IGNORE INTO transactions (amount, category, date, sms_hash) VALUES (?, ?, ?, ?);',
        [amount, category, date, smsHash],
      );
      return (result.rowsAffected || 0) > 0;
    } else {
      // Manual entry — no hash, always insert
      db.execute(
        'INSERT INTO transactions (amount, category, date) VALUES (?, ?, ?);',
        [amount, category, date],
      );
      return true;
    }
  } catch (error) {
    console.error('Database insert error:', error);
    return false;
  }
}

/**
 * Check if an SMS has already been processed
 * @param {string} smsHash - Hash to check
 * @returns {boolean}
 */
export function isDuplicate(smsHash) {
  try {
    initDB();
    const result = db.execute(
      'SELECT COUNT(*) as count FROM transactions WHERE sms_hash = ?;',
      [smsHash],
    );
    const rows = getRows(result);
    return rows.length > 0 && (rows[0]?.count || 0) > 0;
  } catch (error) {
    console.error('Duplicate check error:', error);
    return false;
  }
}

/**
 * Get today's date string in YYYY-MM-DD format
 * @returns {string}
 */
export function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetch all transactions for today
 * @returns {Array} - Array of transaction objects
 */
export function getTodayTransactions() {
  try {
    initDB();
    const today = getTodayDate();
    const result = db.execute(
      'SELECT * FROM transactions WHERE date = ? ORDER BY created_at DESC;',
      [today],
    );
    return getRows(result);
  } catch (error) {
    console.error('Fetch today transactions error:', error);
    return [];
  }
}

/**
 * Get the total spent amount for today
 * @returns {number}
 */
export function getTodayTotal() {
  try {
    initDB();
    const today = getTodayDate();
    const result = db.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE date = ?;',
      [today],
    );
    const rows = getRows(result);
    return rows.length > 0 ? (rows[0]?.total || 0) : 0;
  } catch (error) {
    console.error('Fetch today total error:', error);
    return 0;
  }
}

/**
 * Fetch all transactions ordered by date descending
 * @param {number} limit - Max number of results (default 100)
 * @returns {Array}
 */
export function getAllTransactions(limit = 100) {
  try {
    initDB();
    const result = db.execute(
      'SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ?;',
      [limit],
    );
    return getRows(result);
  } catch (error) {
    console.error('Fetch all transactions error:', error);
    return [];
  }
}

/**
 * Delete a transaction by ID
 * @param {number} id - Transaction ID
 * @returns {boolean} - true if deleted
 */
export function deleteTransaction(id) {
  try {
    initDB();
    const result = db.execute(
      'DELETE FROM transactions WHERE id = ?;',
      [id],
    );
    return (result.rowsAffected || 0) > 0;
  } catch (error) {
    console.error('Delete transaction error:', error);
    return false;
  }
}
