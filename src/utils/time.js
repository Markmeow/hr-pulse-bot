'use strict';

/**
 * Parse a human-friendly "when" string into an absolute timestamp (ms since epoch).
 *
 * Supported formats:
 *   - Relative durations: "10m", "2h", "1d", "1h30m", "45s", "1w"
 *   - Absolute date/time:  "2025-06-20 14:30"  or  "2025-06-20T14:30"
 *
 * @param {string} input  The raw text the user typed.
 * @returns {{ timestamp: number } | { error: string }}
 */
function parseWhen(input) {
  if (!input || typeof input !== 'string') {
    return { error: 'Please provide a time, e.g. `30m`, `2h`, `1d`, or `2025-06-20 14:30`.' };
  }

  const text = input.trim();

  // --- Try relative duration first (e.g. "1h30m", "2d", "45s") ---
  const durationRegex = /(\d+)\s*(w|d|h|m|s)/gi;
  const unitToMs = {
    w: 7 * 24 * 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  };

  let totalMs = 0;
  let matchedAny = false;
  let match;
  // Only treat it as a duration if the WHOLE string is made of duration tokens
  const strippedOfTokens = text.replace(durationRegex, '').trim();
  if (strippedOfTokens === '') {
    while ((match = durationRegex.exec(text)) !== null) {
      const amount = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      totalMs += amount * unitToMs[unit];
      matchedAny = true;
    }
  }

  if (matchedAny && totalMs > 0) {
    return { timestamp: Date.now() + totalMs };
  }

  // --- Fall back to absolute date parsing ---
  // Accept "YYYY-MM-DD HH:MM" by normalizing the space to "T"
  const normalized = text.replace(' ', 'T');
  const parsed = Date.parse(normalized);
  if (!Number.isNaN(parsed)) {
    if (parsed <= Date.now()) {
      return { error: 'That time is in the past. Please choose a future time.' };
    }
    return { timestamp: parsed };
  }

  return {
    error:
      'I could not understand that time. Try a duration like `30m`, `2h`, `1d`, `1h30m`, ' +
      'or an absolute time like `2025-06-20 14:30`.',
  };
}

/**
 * Format a timestamp as a Discord relative timestamp string, e.g. <t:1234567890:R>.
 * Discord renders this as "in 2 hours" automatically and per-user timezone.
 *
 * @param {number} ms  Timestamp in milliseconds.
 * @returns {string}
 */
function discordTimestamp(ms, style = 'F') {
  const seconds = Math.floor(ms / 1000);
  return `<t:${seconds}:${style}>`;
}

module.exports = { parseWhen, discordTimestamp };
