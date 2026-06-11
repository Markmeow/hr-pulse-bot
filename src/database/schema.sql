-- ============================================================
--  Internship Assistant Bot - Database Schema
-- ============================================================

-- Todo tasks created with /todo add
CREATE TABLE IF NOT EXISTS todos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT    NOT NULL,
  guild_id     TEXT    NOT NULL,
  task         TEXT    NOT NULL,
  done         INTEGER NOT NULL DEFAULT 0,        -- 0 = open, 1 = completed
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Standup answers collected with /standup
CREATE TABLE IF NOT EXISTS standups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  guild_id   TEXT NOT NULL,
  yesterday  TEXT,
  today      TEXT,
  blockers   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Scheduled reminders created with /remind add
CREATE TABLE IF NOT EXISTS reminders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT    NOT NULL,
  guild_id   TEXT    NOT NULL,
  channel_id TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  remind_at  INTEGER NOT NULL,                    -- unix timestamp in milliseconds
  sent       INTEGER NOT NULL DEFAULT 0,          -- 0 = pending, 1 = already sent
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Registered users (auth system)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id    TEXT    NOT NULL,
  username      TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,
  api_key       TEXT,
  guild_id      TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login    TEXT,
  UNIQUE (discord_id, guild_id),
  UNIQUE (username, guild_id)
);

-- Daily break records
CREATE TABLE IF NOT EXISTS breaks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT    NOT NULL,
  guild_id     TEXT    NOT NULL,
  channel_id   TEXT    NOT NULL,
  break_time   TEXT    NOT NULL,             -- "12:00" display string
  duration_ms  INTEGER DEFAULT 3600000,      -- break duration in ms (default 1h)
  scheduled_at INTEGER NOT NULL,             -- unix ms when break should start
  started_at   INTEGER,                      -- unix ms when bot notified (on_break)
  returned_at  INTEGER,                      -- unix ms when user ran /break return
  end_warned   INTEGER DEFAULT 0,            -- 1 = 5-min warning already sent
  status       TEXT    NOT NULL DEFAULT 'scheduled', -- scheduled / on_break / returned
  date         TEXT    NOT NULL,             -- "YYYY-MM-DD" for uniqueness per day
  UNIQUE (user_id, guild_id, date)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_todos_user      ON todos (user_id, guild_id, done);
CREATE INDEX IF NOT EXISTS idx_reminders_due   ON reminders (sent, remind_at);
CREATE INDEX IF NOT EXISTS idx_standups_user   ON standups (user_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_users_discord   ON users (discord_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_users_username  ON users (username, guild_id);
CREATE INDEX IF NOT EXISTS idx_breaks_due      ON breaks (status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_breaks_today    ON breaks (guild_id, date);
