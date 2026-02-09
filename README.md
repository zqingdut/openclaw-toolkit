# 🦞 OpenClaw Toolkit

**The "No-Brainer" Setup Helper for OpenClaw.**  
*Zero dependencies. Just Node.js.*

## Why?
Setting up OpenClaw can be tricky:
- ❌ **Config Hell:** Manually editing huge JSON files is prone to syntax errors.
- ❌ **Network Issues:** API calls fail silently if proxies aren't set right.
- ❌ **Process Stability:** The gateway stops when you close the terminal.

**This toolkit fixes all of that.**

## ✨ Features

1.  **🛠️ Config Generator:** Interactive wizard to set up API keys, models, and providers correctly.
2.  **🩺 Network Doctor:** Checks connectivity to OpenAI/Google/GitHub and suggests proxy settings.
3.  **🐕 Watchdog Installer:** Sets up a background daemon (LaunchAgent) to keep OpenClaw running 24/7.

## 🚀 Quick Start

You don't need to install anything (no `npm install`). Just clone and run.

```bash
git clone https://github.com/zqingdut/openclaw-toolkit.git
cd openclaw-toolkit
./index.cjs
```

## 📸 Preview

```text
🦞 OpenClaw Toolkit - The "No-Brainer" Setup Helper (Zero Dependency)
----------------------------------------------------

1. 🛠️  Generate Config (Fix API Keys/Models)
2. 🩺  Check Network & API Connection
3. 🐕  Install Watchdog (Auto-Restart)
4. 🚪  Exit

Choose an option (1-4): 
```

## Requirements
- Node.js (v18+)
- macOS / Linux

## License
MIT
