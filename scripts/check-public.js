'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const failures = [];
const allowed = new Set([
  'README.md', 'LICENSE.md', 'LICENSE', 'LICENSE-CODE', 'LICENSE-DOCS',
  'CONTRIBUTING.md', 'SECURITY.md', 'CHANGELOG.md', 'AUTHORS.md', '.gitignore', '.gitattributes',
  'package.json', 'package-lock.json',
  'demo/index.html', 'demo/styles.css', 'demo/logic.js', 'demo/app.js', 'demo/journey.js',
  'docs/product.md', 'docs/architecture.md', 'docs/privacy-and-boundaries.md',
  'docs/roadmap.md', 'docs/releasing.md', 'docs/usability.md', 'docs/contribution-tasks.md',
  'scripts/check-public.js', 'tests/logic.test.js', 'tests/app.test.js', 'tests/workflow.test.js',
  '.github/workflows/check.yml', '.github/ISSUE_TEMPLATE/feedback.md'
]);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (['.git', 'node_modules'].includes(entry.name)) return [];
    const absolute = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) { failures.push(`Symbolic link is not allowed: ${path.relative(root, absolute)}`); return []; }
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}
const files = walk(root);
const patterns = [
  ['local private path', /[A-Za-z]:[\\/](?:Users|dev)[\\/]/i],
  ['mobile phone', /(?<!\d)1[3-9]\d{9}(?!\d)/],
  ['email address', /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub token', /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})/],
  ['personal identifier', /(?<!\d)[1-9]\d{5}(?:19|20)\d{9}[\dXx](?!\d)/]
];
for (const file of files) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  if (!allowed.has(relative)) failures.push(`Unreviewed publication file: ${relative}`);
  const content = fs.readFileSync(file, 'utf8');
  for (const [label, expression] of patterns) {
    // Only the author's explicitly authorized public contact is exempted,
    // and only in the two reviewed contact documents.
    const scanContent = label === 'email address' && ['README.md', 'AUTHORS.md'].includes(relative)
      ? content.replaceAll(['eoggwccmgeya', '163.com'].join('@'), '') : content;
    if (expression.test(scanContent)) failures.push(`${label}: ${relative} (review locally; matched text is not printed)`);
  }
  if (file.endsWith('.js')) {
    try { new vm.Script(content, { filename: relative }); }
    catch (error) { failures.push(`JavaScript syntax: ${relative}: ${error.message}`); }
  }
  if (relative.startsWith('demo/') && file.endsWith('.js')) {
    if (/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB)\b|document\.cookie/.test(content)) {
      failures.push(`Network or persistent storage API in offline demo: ${relative}`);
    }
    if (/\.innerHTML\s*=|\beval\s*\(|new Function\s*\(/.test(content)) failures.push(`Unsafe dynamic execution or HTML assignment: ${relative}`);
  }
  const references = file.endsWith('.html')
    ? [...content.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1])
    : file.endsWith('.md') ? [...content.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1]) : [];
  for (const reference of references) {
    if (reference.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(reference)) continue;
    const target = path.resolve(path.dirname(file), reference.split('#')[0]);
    if (!(target === root || target.startsWith(root + path.sep))) failures.push(`Link leaves public package: ${relative}`);
    else if (!fs.existsSync(target)) failures.push(`Missing local link: ${relative} -> ${reference}`);
  }
}
const html = fs.readFileSync(path.join(root, 'demo/index.html'), 'utf8');
const app = ['app.js', 'journey.js'].map(name => fs.readFileSync(path.join(root, 'demo', name), 'utf8')).join('\n');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) failures.push('Duplicate HTML IDs');
for (const match of app.matchAll(/byId\('([^']+)'\)/g)) {
  if (!ids.includes(match[1])) failures.push(`Missing DOM element: ${match[1]}`);
}
if (!html.includes("connect-src 'none'") || !html.includes("form-action 'none'")) failures.push('Missing offline CSP constraints');
// Outbound documentation links are allowed; remote embedded assets remain forbidden.
if (/<(?:script|link|img|iframe|audio|video)\b[^>]*(?:src|href)="https?:/i.test(html) || /@import|url\(\s*["']?https?:/i.test(fs.readFileSync(path.join(root, 'demo/styles.css'), 'utf8'))) failures.push('External demo asset');
if (process.argv.includes('--release')) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!pkg.license || pkg.license === 'UNLICENSED') failures.push('Release blocked: license selection is pending');
  if (!['LICENSE', 'LICENSE-CODE'].some(name => fs.existsSync(path.join(root, name)))) failures.push('Release blocked: full code license text is missing');
  if (fs.readFileSync(path.join(root, 'LICENSE.md'), 'utf8').includes('许可状态：待确认')) failures.push('Release blocked: license documentation is still pending');
  if (fs.readFileSync(path.join(root, 'README.md'), 'utf8').includes('许可证尚未选定')) failures.push('Release blocked: README still describes pending permission');
  if (pkg.license !== 'MIT AND CC-BY-4.0') failures.push('Release blocked: package license does not match the selected scope');
  if (!fs.existsSync(path.join(root, 'LICENSE-DOCS'))) failures.push('Release blocked: full document license text is missing');
  else if (!fs.readFileSync(path.join(root, 'LICENSE-DOCS'), 'utf8').includes('Creative Commons Attribution 4.0 International Public License')) failures.push('Release blocked: document license text is incomplete');
  if (fs.existsSync(path.join(root, 'LICENSE-CODE')) && !fs.readFileSync(path.join(root, 'LICENSE-CODE'), 'utf8').includes('Copyright (c) 2026 罗费翔 (LuoFeiXiang)')) failures.push('Release blocked: author copyright notice is missing');
}
if (failures.length) {
  console.error(failures.map(message => `FAIL: ${message}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${files.length} reviewed files; links, syntax, DOM IDs, offline APIs and sensitive patterns checked.`);
  if (!process.argv.includes('--release')) console.log('License and rights review remain separate. Run npm run check:release before publishing.');
}
