CREATE TABLE IF NOT EXISTS todos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT    NOT NULL,
  guild_id     TEXT    NOT NULL,
  task         TEXT    NOT NULL,
  done         INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS standups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  guild_id   TEXT NOT NULL,
  yesterday  TEXT,
  today      TEXT,
  blockers   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reminders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT    NOT NULL,
  guild_id   TEXT    NOT NULL,
  channel_id TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  remind_at  INTEGER NOT NULL,
  sent       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

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

CREATE TABLE IF NOT EXISTS breaks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT    NOT NULL,
  guild_id     TEXT    NOT NULL,
  channel_id   TEXT    NOT NULL,
  break_time   TEXT    NOT NULL,
  duration_ms  INTEGER DEFAULT 3600000,
  scheduled_at INTEGER NOT NULL,
  started_at   INTEGER,
  returned_at  INTEGER,
  end_warned   INTEGER DEFAULT 0,
  status       TEXT    NOT NULL DEFAULT 'scheduled',
  date         TEXT    NOT NULL,
  UNIQUE (user_id, guild_id, date)
);

CREATE INDEX IF NOT EXISTS idx_todos_user      ON todos (user_id, guild_id, done);
CREATE INDEX IF NOT EXISTS idx_reminders_due   ON reminders (sent, remind_at);
CREATE INDEX IF NOT EXISTS idx_standups_user   ON standups (user_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_users_discord   ON users (discord_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_users_username  ON users (username, guild_id);
CREATE INDEX IF NOT EXISTS idx_breaks_due      ON breaks (status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_breaks_today    ON breaks (guild_id, date);
