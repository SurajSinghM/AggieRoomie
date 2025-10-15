const fs = require('fs');
const path = require('path');

// Configuration
const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', '.next']);
const PRESERVE_KEYWORDS = ['TODO', 'FIXME', 'LICENSE', 'COPYRIGHT', 'ESLINT', 'PRETTIER', 'IMPORTANT'];
const FILE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.scss']);

function shouldPreserveComment(comment) {
  if (!comment) return false;
  const up = comment.toUpperCase();
  return PRESERVE_KEYWORDS.some(k => up.includes(k));
}

function stripCommentsFromContent(content) {
  // Remove block comments first, but preserve if contain keywords
  content = content.replace(/\/\*[\s\S]*?\*\//g, (m) => {
    return shouldPreserveComment(m) ? m : '';
  });

  // Remove single-line comments, but preserve ones that include keywords
  content = content.replace(/(^|[^:\\])\/\/.*$/gm, (m, p1) => {
    // m includes leading char if captured; reconstruct comment text only
    const commentText = m.replace(/(^|[^:\\])/, '').trim();
    return shouldPreserveComment(commentText) ? m : (p1 || '');
  });

  return content;
}

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.has(file)) {
        results.push(...walk(full));
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (FILE_EXTENSIONS.has(ext)) results.push(full);
    }
  }
  return results;
}

function backupFile(filePath) {
  const bak = filePath + '.bak';
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(filePath, bak);
  }
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stripped = stripCommentsFromContent(content);
    if (stripped !== content) {
      backupFile(filePath);
      fs.writeFileSync(filePath, stripped, 'utf8');
      console.log('Stripped comments:', filePath);
    }
  } catch (err) {
    console.error('Error processing', filePath, err.message);
  }
}

function main() {
  console.log('Scanning for files...');
  const files = walk(ROOT);
  console.log('Files found:', files.length);
  for (const f of files) processFile(f);
  console.log('Done. Backups written as .bak files where changes occurred.');
}

main();
