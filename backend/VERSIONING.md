# Semantic Versioning System

This project uses **automatic semantic versioning** that increments on every commit based on the changes made.

## Version Format: `MAJOR.MINOR.PATCH`

### 🚀 MAJOR (x.0.0)

**Multiple functionalities, breaking changes**

Triggers:

- 10+ files changed
- Keywords: `breaking`, `major`, `multiple features`, `architecture`, `refactor all`
- Structural changes to the codebase
- API changes that break backward compatibility

Examples:

```bash
git commit -m "feat: add Bitcoin and Solana support (breaking: new chain architecture)"
git commit -m "major: refactor all API endpoints with v2 structure"
```

Manual bump:

```bash
npm run version:major
```

---

### ✨ MINOR (0.x.0)

**Single functionality, new features, fixes**

Triggers:

- 4-10 files changed
- Keywords: `feat:`, `feature:`, `add:`, `implement:`, `fix:`, `security:`, `improve:`
- New features that don't break existing functionality
- Bug fixes
- Performance improvements

Examples:

```bash
git commit -m "feat: implement 15-hop mixing for withdrawals"
git commit -m "fix: resolve RPC timeout issues with fallback provider"
git commit -m "add: API key expiration monitoring system"
```

Manual bump:

```bash
npm run version:minor
```

---

### 🔧 PATCH (0.0.x)

**Simple fixes, styling, minor changes**

Triggers:

- 1-3 files changed
- Keywords: `patch:`, `style:`, `docs:`, `chore:`, `typo:`, `format:`, `refactor:`
- Documentation updates
- Code formatting
- Small refactors
- Typo fixes

Examples:

```bash
git commit -m "docs: update API documentation for drain endpoint"
git commit -m "style: format code with prettier"
git commit -m "chore: update dependencies"
```

Manual bump:

```bash
npm run version:patch
```

---

## Automatic Versioning

### How It Works

1. **Pre-commit Hook**: Runs before every commit
2. **Analyzes Changes**:
   - Reads commit message
   - Counts staged files
   - Detects keywords
3. **Determines Bump Type**: MAJOR/MINOR/PATCH
4. **Updates Files**:
   - `package.json` version
   - `CHANGELOG.md` entry
5. **Stages Changes**: Includes version files in commit

### Setup

1. **Install Hook** (one-time):

```bash
cd /home/puxxo/CodeBase/drain/backend
cp .git-hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

2. **Make Commits** (versions automatically):

```bash
git add .
git commit -m "feat: add new mixing strategy"
# Auto-bumps to 1.1.0
```

3. **Manual Version Bump** (if needed):

```bash
npm run version:major   # 1.0.0 → 2.0.0
npm run version:minor   # 1.0.0 → 1.1.0
npm run version:patch   # 1.0.0 → 1.0.1
```

---

## Commit Message Best Practices

### Use Conventional Commits

Format: `<type>: <description>`

**Types**:

- `feat:` - New feature (MINOR)
- `fix:` - Bug fix (MINOR)
- `docs:` - Documentation (PATCH)
- `style:` - Code formatting (PATCH)
- `refactor:` - Code restructure (MINOR/MAJOR)
- `test:` - Adding tests (PATCH)
- `chore:` - Maintenance (PATCH)
- `breaking:` - Breaking change (MAJOR)

**Examples**:

```bash
# Good commits
git commit -m "feat: implement Solana SPL token support"
git commit -m "fix: resolve custody wallet encryption bug"
git commit -m "docs: add API authentication guide"

# Better commits (with scope)
git commit -m "feat(mixing): add 15-hop withdrawal path"
git commit -m "fix(rpc): handle timeout with Alchemy fallback"
git commit -m "docs(api): document drain endpoint parameters"
```

---

## Version History

Check `CHANGELOG.md` for detailed version history:

```bash
# View recent changes
head -50 CHANGELOG.md

# View specific version
grep -A 20 "\[1.2.0\]" CHANGELOG.md
```

---

## Disable Auto-Versioning (if needed)

### Temporarily (single commit):

```bash
git commit -m "..." --no-verify
```

### Permanently:

```bash
rm .git/hooks/pre-commit
```

---

## Version Metadata

Current version is always in:

- `package.json` → `"version": "x.x.x"`
- `CHANGELOG.md` → Top entry

Check version:

```bash
npm run version  # Shows current version
node -p "require('./package.json').version"
```

---

## CI/CD Integration

The versioning system integrates with CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Get version
  id: version
  run: echo "VERSION=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT

- name: Tag release
  run: |
    git tag v${{ steps.version.outputs.VERSION }}
    git push --tags
```

---

## Examples by Scenario

| Scenario                | Files Changed | Keywords              | Bump Type | New Version   |
| ----------------------- | ------------- | --------------------- | --------- | ------------- |
| Add Bitcoin support     | 15 files      | `multiple features`   | MAJOR     | 1.0.0 → 2.0.0 |
| Fix RPC timeout         | 2 files       | `fix:`                | MINOR     | 1.0.0 → 1.1.0 |
| Update README           | 1 file        | `docs:`               | PATCH     | 1.0.0 → 1.0.1 |
| Add 15-hop mixing       | 5 files       | `feat:`, `implement:` | MINOR     | 1.0.0 → 1.1.0 |
| Format with Prettier    | 20 files      | `style:`              | PATCH     | 1.0.0 → 1.0.1 |
| Refactor API (breaking) | 8 files       | `breaking`            | MAJOR     | 1.0.0 → 2.0.0 |

---

## FAQ

**Q: Can I override the automatic bump?**
A: Yes, use `npm run version:major/minor/patch` before committing.

**Q: What if I forget to set up the hook?**
A: Run `npm run version:precommit` manually before each commit.

**Q: Does this work with branches?**
A: Yes, each branch maintains its own version. Merge carefully to avoid conflicts.

**Q: Can I skip versioning for WIP commits?**
A: Yes, use `git commit --no-verify` to skip the hook.

**Q: How do I sync version with tags?**
A: After commit, run `git tag v$(npm run version -s) && git push --tags`

---

## Troubleshooting

### Hook not running

```bash
# Check hook exists
ls -la .git/hooks/pre-commit

# Make executable
chmod +x .git/hooks/pre-commit

# Test manually
./git/hooks/pre-commit
```

### Wrong version bump

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Fix version manually
npm run version:patch  # or minor/major

# Recommit
git commit -m "..."
```

### Changelog conflicts

```bash
# If CHANGELOG.md has conflicts after merge
# Keep both entries, sort by date
# Or regenerate from git log
```

---

**Current Version**: 1.0.0  
**Last Updated**: 2025-11-20
