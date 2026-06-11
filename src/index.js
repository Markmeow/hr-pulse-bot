'use strict';

require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// --- Validate required environment variables early ---
if (!process.env.DISCORD_TOKEN) {
  console.error('[fatal] DISCORD_TOKEN is missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

// --- Create the client ---
// Guilds intent is all we need for slash commands, modals, and sending messages.
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// --- Load commands into client.commands ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command?.data && command?.execute) {
    client.commands.set(command.data.name, command);
    console.log(`[load] Command: /${command.data.name}`);
  } else {
    console.warn(`[load] Skipping ${file} (missing "data" or "execute").`);
  }
}

// --- Load event handlers ---
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`[load] Event: ${event.name}`);
}

// --- Global safety nets ---
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

// --- Log in ---
client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('[fatal] Failed to log in. Check your DISCORD_TOKEN.', err);
  process.exit(1);
});
