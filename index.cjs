#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CONFIG_PATH = path.join(os.homedir(), '.openclaw', 'openclaw.json');
const BACKUP_PATH = path.join(os.homedir(), '.openclaw', 'openclaw.json.bak');

// --- Helper: Color ---
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  gray: "\x1b[90m"
};

const log = (msg, color = colors.reset) => console.log(`${color}${msg}${colors.reset}`);

// --- Helper: Prompt ---
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (query) => new Promise((resolve) => rl.question(`${colors.bright}${query}${colors.reset} `, resolve));

async function main() {
  console.clear();
  log('🦞 OpenClaw Toolkit - The "No-Brainer" Setup Helper (Zero Dependency)', colors.cyan);
  log('----------------------------------------------------', colors.gray);

  log('\n1. 🛠️  Generate Config (Fix API Keys/Models)');
  log('2. 🩺  Check Network & API Connection');
  log('3. 🐕  Install Watchdog (Auto-Restart)');
  log('4. 🌐  Launch Web UI (New!)', colors.green);
  log('5. 🚪  Exit');

  const choice = await ask('\nChoose an option (1-5): ');

  switch (choice.trim()) {
    case '1': await generateConfig(); break;
    case '2': await checkNetwork(); break;
    case '3': await installWatchdog(); break;
    case '4': 
      const { spawn } = require('child_process');
      const serverPath = path.join(__dirname, 'server.cjs');
      log('Starting Web UI...', colors.cyan);
      const child = spawn('node', [serverPath], { stdio: 'inherit' });
      // Keep parent alive
      await new Promise(() => {}); 
      break;
    case '5': 
      log('Bye! Happy Clawing. 🦞', colors.blue);
      process.exit(0);
      break;
    default:
      log('Invalid option.', colors.red);
      await main();
  }
}

// --- 1. Config Generator ---
async function generateConfig() {
  log('\n--- Config Generator ---', colors.yellow);
  log(`Target: ${CONFIG_PATH}`, colors.gray);

  log('\nWhich AI Provider do you use?');
  log('1. OpenAI');
  log('2. Anthropic');
  log('3. Google (Gemini)');
  log('4. Custom (OneAPI/NewAPI)');
  
  const pChoice = await ask('Select Provider (1-4): ');
  let provider = 'openai';
  let defaultBaseUrl = 'https://api.openai.com/v1';

  if (pChoice === '2') { provider = 'anthropic'; defaultBaseUrl = 'https://api.anthropic.com/v1'; }
  if (pChoice === '3') { provider = 'google'; defaultBaseUrl = 'https://generativelanguage.googleapis.com/v1beta'; }
  
  const apiKey = await ask('Enter your API Key: ');
  const baseUrl = await ask(`Base URL [Default: ${defaultBaseUrl}]: `) || defaultBaseUrl;

  const config = {
    meta: { lastTouchedBy: "openclaw-toolkit-lite" },
    gateway: {
      port: 18789,
      mode: "local",
      bind: "loopback",
      auth: { mode: "token", token: "change-me-" + Math.random().toString(36).substring(7) }
    },
    auth: {
      profiles: {
        "default": { provider, mode: "api_key" }
      }
    },
    models: {
      providers: {
        "default": {
          baseUrl,
          apiKey,
          api: "openai-completions",
          models: [
            { id: "gpt-4o", name: "GPT-4o", reasoning: false },
            { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", reasoning: false }
          ]
        }
      }
    }
  };

  if (fs.existsSync(CONFIG_PATH)) {
    try {
      fs.copyFileSync(CONFIG_PATH, BACKUP_PATH);
      log(`✅ Backup created at ${BACKUP_PATH}`, colors.green);
    } catch (e) {
      log(`⚠️  Could not create backup: ${e.message}`, colors.yellow);
    }
  }

  // Ensure dir exists
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  log('✅ openclaw.json has been generated successfully!', colors.green);
  log('⚠️  Note: Restart OpenClaw to apply changes.', colors.yellow);
  
  await wait();
}

// --- 2. Network Doctor ---
async function checkNetwork() {
  log('\n--- Network Doctor ---', colors.yellow);
  
  const checks = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'OpenAI API', url: 'https://api.openai.com' },
    { name: 'GitHub', url: 'https://github.com' }
  ];

  for (const check of checks) {
    process.stdout.write(`Testing ${check.name}... `);
    try {
      execSync(`curl -I --connect-timeout 5 ${check.url} 2>/dev/null`);
      log('OK ✅', colors.green);
    } catch (e) {
      log('FAIL ❌', colors.red);
      if (process.env.https_proxy || process.env.http_proxy) {
        log(`  -> Proxy detected but failed. Check your proxy settings.`, colors.gray);
      } else {
        log(`  -> Hint: If in China, set a proxy (e.g., export https_proxy=http://127.0.0.1:7890)`, colors.gray);
      }
    }
  }
  await wait();
}

// --- 3. Watchdog Installer ---
async function installWatchdog() {
  log('\n--- Watchdog Installer ---', colors.yellow);
  log('This will install a background service to keep OpenClaw alive.');
  
  // Create the monitor script content directly
  const scriptContent = `#!/bin/bash
# OpenClaw Watchdog (Lite)
while true; do
  if ! pgrep -x "openclaw-gateway" > /dev/null; then
    echo "[$(date)] OpenClaw died. Restarting..."
    openclaw gateway restart
  fi
  sleep 300
done
`;
  
  const scriptPath = path.join(os.homedir(), '.openclaw', 'watchdog-lite.sh');
  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755');
  
  log(`✅ Script created at: ${scriptPath}`, colors.green);
  log(`Run this command to start it in background:`, colors.cyan);
  log(`nohup ${scriptPath} > ~/.openclaw/watchdog.log 2>&1 &`);
  
  await wait();
}

async function wait() {
  await ask('\nPress Enter to return to menu...');
  main();
}

main();
