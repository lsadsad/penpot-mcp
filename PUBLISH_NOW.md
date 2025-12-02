# Publishing penpot-mcp to npm - Step by Step Guide

Follow these steps in order. Each step has verification so you know it worked.

## Pre-Flight Checks

### 1. Verify You're in the Right Directory

```bash
cd /Users/levinsadsad/Documents/Github/penpot-mcp
pwd  # Should show: /Users/levinsadsad/Documents/Github/penpot-mcp
```

### 2. Check Node/npm Version

```bash
node --version  # Should be v18 or higher
npm --version   # Should be 9.x or higher
```

If not installed, install from: https://nodejs.org/

---

## Step 1: Build Everything

### Build all packages:

```bash
npm run build:all
```

**Expected output**:
- You'll see three build processes running (COMMON, MCP-SERVER, PLUGIN)
- Green success messages
- No red error messages

**What this does**:
- Builds `common/` → `common/dist/`
- Builds `mcp-server/` → `mcp-server/dist/index.js` and `mcp-server/dist/cli.js`
- Builds `penpot-plugin/` → `penpot-plugin/dist/`

### Verify the build worked:

```bash
ls -la mcp-server/dist/
```

**You should see**:
- `index.js` ✅
- `cli.js` ✅
- `static/` directory ✅

---

## Step 2: Test the CLI Locally

Before publishing, make sure the CLI works:

```bash
node mcp-server/dist/cli.js --help
```

**Expected output**:
```
Penpot MCP Server - Model Context Protocol server for Penpot

Usage: penpot-mcp [options]

Options:
  --port, -p <number>      HTTP/SSE server port (default: 4401)
  --ws-port <number>       WebSocket server port (default: 4402)
  ...
```

If you see this, the CLI works! ✅

---

## Step 3: Verify Package Contents

Check what will be published:

```bash
npm pack --dry-run
```

**Expected output**:
- Shows a list of files that will be included
- Should include:
  - `mcp-server/dist/`
  - `toolkit/`
  - `data/`
  - `README.md`
  - `LICENSE`
- Should NOT include:
  - `node_modules/`
  - Source `.ts` files
  - `.git/`

**Verify toolkit is included**:

```bash
npm pack --dry-run | grep toolkit
```

You should see multiple `toolkit/` entries ✅

---

## Step 4: Create npm Account (First Time Only)

**Skip this if you already have an npm account**

1. Go to https://www.npmjs.com/signup
2. Create an account
3. Verify your email

---

## Step 5: Login to npm

```bash
npm login
```

**You'll be prompted for**:
- Username
- Password
- Email
- One-time password (if you have 2FA enabled)

**Verify you're logged in**:

```bash
npm whoami
```

Should show your npm username ✅

---

## Step 6: Check Package Name Availability

Before publishing, check if `penpot-mcp` is available:

```bash
npm view penpot-mcp
```

**If you see**:
- `npm ERR! 404 'penpot-mcp' is not in this registry.` → **Good! Name is available** ✅
- Package details → **Name is taken** ❌

### If name is taken:

**Option 1**: Use a scoped package (recommended)

Edit `package.json`:
```json
{
  "name": "@yourUsername/penpot-mcp"
}
```

**Option 2**: Use a different name

Edit `package.json`:
```json
{
  "name": "penpot-mcp-server"
}
```

---

## Step 7: Publish to npm

### For unscoped package (penpot-mcp):

```bash
npm publish
```

### For scoped package (@yourUsername/penpot-mcp):

```bash
npm publish --access public
```

**Expected output**:
```
npm notice
npm notice 📦  penpot-mcp@1.0.0
npm notice === Tarball Contents ===
npm notice ... (list of files)
npm notice === Tarball Details ===
npm notice name:          penpot-mcp
npm notice version:       1.0.0
npm notice filename:      penpot-mcp-1.0.0.tgz
npm notice package size:  XXX kB
npm notice unpacked size: XXX kB
npm notice total files:   XX
npm notice
+ penpot-mcp@1.0.0
```

✅ **Published!**

---

## Step 8: Verify Publication

### Check on npm website:

Open in browser:
```
https://www.npmjs.com/package/penpot-mcp
```

(Or `https://www.npmjs.com/package/@yourUsername/penpot-mcp` if scoped)

You should see your package page! ✅

### Check via CLI:

```bash
npm view penpot-mcp
```

Should show package details ✅

---

## Step 9: Test the Published Package

### Test 1: Install globally and run

In a **different terminal/directory**:

```bash
# Create test directory
mkdir ~/test-penpot-mcp
cd ~/test-penpot-mcp

# Install your package
npm install -g penpot-mcp

# Test the CLI
penpot-mcp --help
```

**Expected**: Help message appears ✅

### Test 2: Run via npx (no install)

```bash
npx penpot-mcp --version
```

**Expected**: Shows version 1.0.0 ✅

### Test 3: Test toolkit operations

```bash
# Create a test file
cat > test-toolkit.js << 'EOF'
import { tokens } from 'penpot-mcp/toolkit/operations/index.js';

console.log('Testing toolkit import...');
const code = tokens.extractTokens();
console.log('✓ Toolkit imports work!');
console.log('Generated code length:', code.length);
EOF

node test-toolkit.js
```

**Expected**:
```
Testing toolkit import...
✓ Toolkit imports work!
Generated code length: XXX
```

✅ Toolkit is accessible!

---

## Step 10: Push Git Tags

Don't forget to push your version tag:

```bash
cd /Users/levinsadsad/Documents/Github/penpot-mcp

# Create version tag
git tag v1.0.0

# Push code and tags
git push origin master
git push origin v1.0.0
```

---

## Troubleshooting

### Error: "You do not have permission to publish"

**Solution**: Package name is taken. Use scoped package or different name (see Step 6).

### Error: "prepublishOnly script failed"

**Solution**: The build failed. Check error messages and fix TypeScript errors.

```bash
# Try building manually
npm run build:all

# Check for errors in the output
```

### CLI doesn't work after install

**Check**:
```bash
which penpot-mcp
cat $(which penpot-mcp)
```

Should show the CLI file. If missing, check `bin` field in `package.json`.

### "Module not found" errors

The build might be incomplete. Try:

```bash
# Clean everything
rm -rf node_modules common/node_modules mcp-server/node_modules penpot-plugin/node_modules
rm -rf common/dist mcp-server/dist penpot-plugin/dist

# Reinstall and rebuild
npm run install:all
npm run build:all
```

---

## Quick Reference

```bash
# Full publish workflow
cd /Users/levinsadsad/Documents/Github/penpot-mcp
npm run build:all                    # Build
node mcp-server/dist/cli.js --help   # Test CLI
npm pack --dry-run                   # Verify contents
npm login                            # Login (first time)
npm publish                          # Publish!
git tag v1.0.0 && git push --tags    # Tag release
```

---

## After Publishing

### Update README.md

Add installation instructions:

```markdown
## Installation

```bash
npm install -g penpot-mcp
penpot-mcp --help
```

Or use without installing:

```bash
npx penpot-mcp
```
\`\`\`

### Announce It!

Share on:
- GitHub Discussions
- Penpot community
- Twitter/X
- Reddit r/penpot

---

## Next Version

When you want to publish updates:

```bash
# Make your changes
git add .
git commit -m "Add new features"

# Bump version (choose one):
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)

# This automatically creates a git commit and tag

# Build and publish
npm run build:all
npm publish

# Push to git
git push origin master --tags
```

---

## Success Checklist

- [ ] Built successfully (`npm run build:all`)
- [ ] CLI works locally (`node mcp-server/dist/cli.js --help`)
- [ ] Package contents verified (`npm pack --dry-run`)
- [ ] Logged in to npm (`npm whoami`)
- [ ] Package name available (`npm view penpot-mcp` → 404)
- [ ] Published to npm (`npm publish`)
- [ ] Visible on npmjs.com
- [ ] Installable globally (`npm install -g penpot-mcp`)
- [ ] CLI works after install (`penpot-mcp --help`)
- [ ] Toolkit accessible (`import { tokens } from 'penpot-mcp/toolkit/operations'`)
- [ ] Git tag pushed (`git push --tags`)

---

**You're ready to publish! 🚀**

Start with Step 1 and work through each step. If you hit any issues, check the Troubleshooting section.
