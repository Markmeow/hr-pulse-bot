'use strict';

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

// Resolve the database file path (default: ./data/bot.db at project root)
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, '..', '..', 'data', 'bot.db');

// Make sure the folder exists before opening the database
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Open the database connection (built into Node 22.5+, no native build needed)
const db = new DatabaseSync(dbPath);

// Recommended pragmas for reliability + performance
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Run the schema (CREATE TABLE IF NOT EXISTS ...) on startup
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Column migrations — safe to run multiple times (errors mean column already exists)
const migrations = [
  'ALTER TABLE breaks ADD COLUMN duration_ms INTEGER DEFAULT 3600000',
  'ALTER TABLE breaks ADD COLUMN end_warned   INTEGER DEFAULT 0',
];
for (const sql of migrations) {
  try { db.exec(sql); } catch { /* already exists */ }
}

console.log(`[database] Connected to SQLite at ${dbPath}`);

module.exports = db;