'use strict';

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, '..', '..', 'data', 'bot.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

const migrations = [
  'ALTER TABLE breaks ADD COLUMN duration_ms INTEGER DEFAULT 3600000',
  'ALTER TABLE breaks ADD COLUMN end_warned   INTEGER DEFAULT 0',
];
for (const sql of migrations) {
  try { db.exec(sql); } catch { }
}

console.log(`[database] Connected to SQLite at ${dbPath}`);

module.exports = db;
