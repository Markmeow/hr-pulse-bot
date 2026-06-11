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
  activity     TEXT,
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

CREATE TABLE IF NOT EXISTS events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id       TEXT    NOT NULL,
  channel_id     TEXT    NOT NULL,
  title          TEXT    NOT NULL,
  description    TEXT    NOT NULL,
  post_time      TEXT    NOT NULL,
  ping_everyone  INTEGER NOT NULL DEFAULT 0,
  ping_role_id   TEXT,
  color          INTEGER NOT NULL DEFAULT 12417529,
  active         INTEGER NOT NULL DEFAULT 1,
  last_sent_date TEXT,
  created_by     TEXT    NOT NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_due ON events (active, post_time);

CREATE TABLE IF NOT EXISTS invite_keys (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id    TEXT NOT NULL,
  key_value   TEXT NOT NULL,
  created_by  TEXT NOT NULL,
  reserved_by TEXT,
  used_by     TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  used_at     TEXT,
  UNIQUE (key_value, guild_id)
);

CREATE INDEX IF NOT EXISTS idx_invite_keys ON invite_keys (guild_id, status);
