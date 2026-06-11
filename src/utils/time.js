'use strict';

function parseWhen(input) {
  if (!input || typeof input !== 'string') {
    return { error: 'Please provide a time, e.g. `30m`, `2h`, `1d`, or `2025-06-20 14:30`.' };
  }

  const text = input.trim();

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

function discordTimestamp(ms, style = 'F') {
  const seconds = Math.floor(ms / 1000);
  return `<t:${seconds}:${style}>`;
}

module.exports = { parseWhen, discordTimestamp };
