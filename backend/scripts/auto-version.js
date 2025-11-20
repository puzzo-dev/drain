#!/usr/bin/env node
/**
 * Auto-versioning system for Git commits
 *
 * Semantic Versioning: MAJOR.MINOR.PATCH
 * - MAJOR (x.0.0): Multiple functionalities, breaking changes
 * - MINOR (0.x.0): Single functionality, new features, fixes
 * - PATCH (0.0.x): Simple fixes, styling, minor changes
 *
 * Usage:
 * - Add to git pre-commit hook
 * - Or run manually: npm run version:precommit
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(__dirname, '../CHANGELOG.md');
const PACKAGE_PATH = path.join(__dirname, '../package.json');

// Keywords for version detection
const MAJOR_KEYWORDS = [
  'breaking',
  'major',
  'multiple features',
  'multi-chain support',
  'architecture',
  'refactor all',
  'complete rewrite',
];

const MINOR_KEYWORDS = [
  'feat:',
  'feature:',
  'add:',
  'implement:',
  'new:',
  'fix:',
  'bugfix:',
  'security:',
  'improve:',
];

const PATCH_KEYWORDS = [
  'patch:',
  'style:',
  'docs:',
  'chore:',
  'typo:',
  'format:',
  'refactor:',
  'test:',
];

function getStagedFiles() {
  try {
    const staged = execSync('git diff --cached --name-only', {
      encoding: 'utf8',
    });
    return staged.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

function getCommitMessage() {
  try {
    // Try to get commit message from .git/COMMIT_EDITMSG
    const commitMsgPath = path.join(process.cwd(), '.git/COMMIT_EDITMSG');
    if (fs.existsSync(commitMsgPath)) {
      return fs.readFileSync(commitMsgPath, 'utf8').trim();
    }
  } catch (error) {
    // Ignore
  }
  return '';
}

function detectVersionBump(files, commitMsg) {
  const allText = (commitMsg + ' ' + files.join(' ')).toLowerCase();

  // Check for major version indicators
  if (
    MAJOR_KEYWORDS.some((keyword) => allText.includes(keyword.toLowerCase()))
  ) {
    return 'major';
  }

  // Check file count - many files = likely major/minor
  if (files.length > 10) {
    return 'minor';
  }

  // Check for minor version indicators
  if (
    MINOR_KEYWORDS.some((keyword) => allText.includes(keyword.toLowerCase()))
  ) {
    return 'minor';
  }

  // Check for patch indicators
  if (
    PATCH_KEYWORDS.some((keyword) => allText.includes(keyword.toLowerCase()))
  ) {
    return 'patch';
  }

  // Default to patch for small changes
  if (files.length <= 3) {
    return 'patch';
  }

  return 'minor';
}

function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
  return pkg.version;
}

function bumpVersion(type) {
  try {
    const output = execSync(`npm version ${type} --no-git-tag-version`, {
      encoding: 'utf8',
    });
    const newVersion = output.trim().replace('v', '');
    console.log(`✅ Version bumped: ${type} → ${newVersion}`);
    return newVersion;
  } catch (error) {
    console.error('❌ Failed to bump version:', error.message);
    process.exit(1);
  }
}

function updateChangelog(version, type, files, commitMsg) {
  const date = new Date().toISOString().split('T')[0];
  const typeEmoji = {
    major: '🚀',
    minor: '✨',
    patch: '🔧',
  };

  let entry = `\n## [${version}] - ${date}\n\n`;
  entry += `### ${typeEmoji[type]} ${type.toUpperCase()} Release\n\n`;

  if (commitMsg) {
    entry += `**Changes**: ${commitMsg}\n\n`;
  }

  entry += `**Modified Files** (${files.length}):\n`;
  files.slice(0, 10).forEach((file) => {
    entry += `- \`${file}\`\n`;
  });

  if (files.length > 10) {
    entry += `- ... and ${files.length - 10} more files\n`;
  }

  entry += '\n---\n';

  // Create or update CHANGELOG.md
  if (!fs.existsSync(CHANGELOG_PATH)) {
    const header =
      '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    fs.writeFileSync(CHANGELOG_PATH, header + entry);
  } else {
    const content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    const lines = content.split('\n');
    const insertIndex = lines.findIndex((line) => line.startsWith('## ['));

    if (insertIndex === -1) {
      fs.appendFileSync(CHANGELOG_PATH, entry);
    } else {
      lines.splice(insertIndex, 0, entry);
      fs.writeFileSync(CHANGELOG_PATH, lines.join('\n'));
    }
  }

  console.log(`📝 Updated CHANGELOG.md`);
}

function main() {
  console.log('🔍 Analyzing commit for auto-versioning...\n');

  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) {
    console.log('⚠️  No staged files found. Skipping versioning.');
    process.exit(0);
  }

  const commitMsg = getCommitMessage();
  const currentVersion = getCurrentVersion();
  const bumpType = detectVersionBump(stagedFiles, commitMsg);

  console.log(`📦 Current version: ${currentVersion}`);
  console.log(`📁 Staged files: ${stagedFiles.length}`);
  console.log(`💬 Commit message: ${commitMsg || '(none yet)'}`);
  console.log(`📈 Detected bump: ${bumpType.toUpperCase()}\n`);

  // Bump version
  const newVersion = bumpVersion(bumpType);

  // Update changelog
  updateChangelog(newVersion, bumpType, stagedFiles, commitMsg);

  // Stage the updated files
  try {
    execSync('git add package.json package-lock.json CHANGELOG.md');
    console.log('✅ Staged version files for commit\n');
  } catch (error) {
    console.error('⚠️  Could not stage version files:', error.message);
  }

  console.log(`🎉 Version ${newVersion} ready for commit!\n`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { detectVersionBump, bumpVersion };
