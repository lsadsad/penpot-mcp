# npm Publishing Workflow

This guide walks you through publishing the `penpot-mcp` package to npm.

## Prerequisites

1. **npm account**: Create one at https://www.npmjs.com/signup
2. **Node.js installed**: Version 18 or higher (check with `node --version`)
3. **Git repository**: Ensure all changes are committed

## One-Time Setup

### 1. Login to npm

```bash
npm login
```

You'll be prompted for:
- Username
- Password
- Email
- One-time password (if 2FA is enabled - highly recommended!)

Verify your login:
```bash
npm whoami
```

### 2. Enable 2FA (Highly Recommended)

```bash
npm profile enable-2fa auth-and-writes
```

This requires 2FA for both login and publishing, making your package more secure.

## Before Publishing

### 1. Test the Build

Ensure everything builds correctly:

```bash
npm run build:all
```

This will:
- Install dependencies for all packages
- Build `common/`, `mcp-server/`, and `penpot-plugin/`
- Create the CLI wrapper at `mcp-server/dist/cli.js`

### 2. Test the CLI Locally

Test that the CLI works before publishing:

```bash
# From the root directory
node mcp-server/dist/cli.js --help
```

You should see the help message with available options.

### 3. Verify Package Contents

Check what will be included in the published package:

```bash
npm pack --dry-run
```

This shows all files that will be included. Verify that:
- ✅ `mcp-server/dist/` is included
- ✅ `penpot-plugin/dist/` is included
- ✅ `common/dist/` is included
- ✅ `data/` folder is included
- ✅ `README.md` is included
- ❌ `node_modules/` is NOT included
- ❌ Source `.ts` files are NOT included (except in `static/`)

### 4. Update Version Number

Before each publish, update the version in `package.json`:

```bash
# For patch releases (bug fixes): 1.0.0 -> 1.0.1
npm version patch

# For minor releases (new features): 1.0.0 -> 1.1.0
npm version minor

# For major releases (breaking changes): 1.0.0 -> 2.0.0
npm version major
```

This automatically:
- Updates `version` in `package.json`
- Creates a git commit
- Creates a git tag

### 5. Review Changes

Double-check your changes:

```bash
git log --oneline -5
git diff HEAD~1
```

## Publishing

### First-Time Publish

```bash
npm publish
```

If you're publishing a scoped package (e.g., `@yourorg/penpot-mcp`):

```bash
# For public scoped package
npm publish --access public

# For private scoped package (requires paid npm account)
npm publish --access restricted
```

### Subsequent Publishes

1. Make your changes
2. Commit to git
3. Update version: `npm version patch` (or minor/major)
4. Build: `npm run build:all`
5. Publish: `npm publish`
6. Push to git: `git push && git push --tags`

## After Publishing

### 1. Verify the Package

Visit your package page:
```
https://www.npmjs.com/package/penpot-mcp
```

### 2. Test Installation

In a different directory, test installing your package:

```bash
# Create test directory
mkdir ~/test-penpot-mcp
cd ~/test-penpot-mcp

# Install your package
npm install penpot-mcp

# Test the CLI
npx penpot-mcp --help
```

### 3. Push Git Tags

Don't forget to push your version tags:

```bash
git push origin main --tags
```

## Using the Published Package

### Global Installation

```bash
npm install -g penpot-mcp
penpot-mcp --help
penpot-mcp  # Start the server
```

### Via npx (No Installation)

```bash
npx penpot-mcp --help
npx penpot-mcp  # Start the server
```

### In Claude Desktop Config

```json
{
    "mcpServers": {
        "penpot": {
            "command": "npx",
            "args": ["-y", "mcp-remote", "http://localhost:4401/sse", "--allow-http"]
        }
    }
}
```

Start the server separately:
```bash
npx penpot-mcp
```

### In Claude Code

```bash
claude mcp add penpot -t http http://localhost:4401/mcp
```

Start the server separately:
```bash
npx penpot-mcp
```

## Troubleshooting

### Package Name Taken

If `penpot-mcp` is already taken on npm, you have options:

1. **Use a scoped package** (recommended):
   - Update `package.json`: `"name": "@yourorg/penpot-mcp"`
   - Publish with: `npm publish --access public`
   - Users install with: `npm install @yourorg/penpot-mcp`

2. **Choose a different name**:
   - Update `package.json`: `"name": "penpot-mcp-server"`
   - Update `bin`: `"penpot-mcp-server": "./mcp-server/dist/cli.js"`

### Build Fails

If `npm run build:all` fails:

```bash
# Clean everything
rm -rf node_modules common/node_modules mcp-server/node_modules penpot-plugin/node_modules
rm -rf common/dist mcp-server/dist penpot-plugin/dist

# Reinstall
npm run install:all

# Try building again
npm run build:all
```

### CLI Not Working After Install

If `npx penpot-mcp` doesn't work:

1. Check the shebang in `mcp-server/dist/cli.js` is `#!/usr/bin/env node`
2. Ensure the file is executable: `chmod +x mcp-server/dist/cli.js`
3. Verify `bin` field in root `package.json` points to correct path

## Best Practices

1. **Always test locally** before publishing
2. **Use semantic versioning** (MAJOR.MINOR.PATCH)
3. **Write release notes** in GitHub releases
4. **Keep README updated** with latest features
5. **Tag releases** in git for version history
6. **Test the published package** before announcing

## Quick Reference

```bash
# Development workflow
npm run build:all                    # Build everything
node mcp-server/dist/cli.js --help   # Test CLI locally

# Publishing workflow
npm version patch                    # Bump version
npm run build:all                    # Build
npm publish                          # Publish to npm
git push && git push --tags          # Push to git

# Testing published package
npx penpot-mcp --help               # Test with npx
```

## Unpublishing (Emergency Only)

If you need to unpublish a version within 72 hours of publishing:

```bash
npm unpublish penpot-mcp@1.0.0
```

**Warning**: Unpublishing is discouraged by npm. Only do this for serious issues like:
- Accidentally published credentials
- Critical security vulnerabilities
- Broken package that can't be used

For minor bugs, publish a patch version instead.

---

## Support

If you encounter issues:
1. Check the [npm documentation](https://docs.npmjs.com/)
2. Run `npm doctor` to diagnose problems
3. File an issue on GitHub
