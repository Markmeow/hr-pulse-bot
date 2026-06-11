'use strict';

require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

// --- Validate environment ---
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('[deploy] DISCORD_TOKEN and CLIENT_ID are required in your .env file.');
  process.exit(1);
}

// --- Gather command definitions ---
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command?.data) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[deploy] Skipping ${file} (no "data" export).`);
  }
}

// --- Register with Discord ---
const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`[deploy] Registering ${commands.length} command(s)...`);

    if (GUILD_ID) {
      // Guild commands update instantly — best for development.
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log(`[deploy] Done. Commands registered to guild ${GUILD_ID}.`);
    } else {
      // Global commands can take up to ~1 hour to propagate.
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log('[deploy] Done. Commands registered globally (may take up to 1 hour).');
    }
  } catch (err) {
    console.error('[deploy] Failed to register commands:', err);
    process.exit(1);
  }
})();
