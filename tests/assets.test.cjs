'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) assert.ok(fs.existsSync(path.join(root, match[1])), 'Missing ' + match[1]);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.scope, './');
for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root, icon.src)));
const installed = [];
const hooks = {};
const context = {
    URL, Response, Promise,
    self: { registration: { scope: 'https://example.test/repository/' }, location: { origin: 'https://example.test' }, addEventListener: (name, fn) => { hooks[name] = fn; }, clients: { claim: async () => {} } },
    caches: { open: async () => ({ addAll: async files => { for (const file of files) { installed.push(file); assert.ok(file === './' || fs.existsSync(path.join(root, file)), 'Missing cache asset: ' + file); } } }) }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8'), context);
(async () => {
    let done;
    hooks.install({ waitUntil: promise => { done = promise; } }); await done;
    assert.ok(installed.includes('./index.html'));
    assert.equal(installed.filter(p => p.endsWith('.js')).length, 12);
    for (const route of ['home', 'stores', 'inspections', 'personnel', 'support', 'weekly', 'settings']) assert.ok(html.includes('./assets/js/pages/' + route + '.js'));
    assert.ok(fs.existsSync(path.join(root, '.nojekyll')));
    console.log('PASS 入口、应用图标、相对路径和全部离线资源存在');
    console.log('PASS Service Worker安装资源列表完整');
})().catch(error => { console.error(error); process.exitCode = 1; });
