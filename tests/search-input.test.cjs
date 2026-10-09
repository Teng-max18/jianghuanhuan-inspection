'use strict';
// 执行真实页面事件代码，检查输入过程中是否替换搜索节点与打断组字。
// 使用最小DOM/时钟模拟，不声称覆盖真实手机输入法或像素布局。
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const docEvents = new Map(), windowEvents = new Map(), timers = new Map();
let nextTimer = 1, shellWrites = 0, resultWrites = 0, focusCalls = 0;
const nodes = {};
const searchNode = () => ({ id: 'page-search', value: '', selectionStart: 0, closest: () => null, focus() { focusCalls++; }, setSelectionRange() { focusCalls++; } });
let toolbar;
nodes.main = { dataset: {}, querySelector: () => toolbar, appendChild(fragment) {
    resultWrites++;
    this.lastResults = fragment.nodes;
    toolbar.nextSibling = { remove() { toolbar.nextSibling = null; } };
} };
const doc = {
    activeElement: null,
    getElementById: id => nodes[id] || null,
    addEventListener: (name, fn) => docEvents.set(name, fn),
    createDocumentFragment: () => ({ nodes: [], appendChild(node) { this.nodes.push(node); } }),
    createElement: name => {
        assert.equal(name, 'template');
        return {
            set innerHTML(html) {
                this.content = { querySelector: selector => {
                    assert.equal(selector, '.toolbar');
                    return html.includes('class="toolbar"') ? { nextSibling: { html, nextSibling: null } } : null;
                } };
            }
        };
    }
};
nodes.app = {
    set innerHTML(html) {
        shellWrites++;
        nodes['page-search'] = html.includes('id="page-search"') ? searchNode() : null;
        doc.activeElement = null;
        toolbar = { nextSibling: { remove() { toolbar.nextSibling = null; } } };
    },
    setAttribute() {}
};
nodes.editor = { addEventListener() {}, close() {} };
nodes.toast = {};
const context = {
    window: { addEventListener: (name, fn) => windowEvents.set(name, fn), scrollTo() {} },
    document: doc, navigator: { onLine: true },
    location: { hash: '#stores', protocol: 'file:' },
    crypto: require('node:crypto').webcrypto,
    console, Date, confirm: () => true,
    setTimeout: fn => { const id = nextTimer++; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id)
};
vm.createContext(context);
const read = name => fs.readFileSync(path.join(__dirname, '../assets/js', name), 'utf8');
for (const name of ['data.js', 'core.js', 'ui.js', 'pages/home.js', 'pages/stores.js', 'pages/inspections.js', 'pages/personnel.js', 'pages/support.js', 'pages/weekly.js', 'pages/settings.js']) vm.runInContext(read(name), context);
const A = context.window.Inspect;
A.state = A.core.emptyState();
A.storage = { init: async () => {}, mode: () => 'indexedDB' };
vm.runInContext(read('app.js'), context);
const flush = () => { const current = Array.from(timers.values()); timers.clear(); current.forEach(fn => fn()); };
const input = (node, value, isComposing = false) => { node.value = value; docEvents.get('input')({ target: node, isComposing }); };
const pass = name => console.log('PASS ' + name);
(async () => {
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(A.route, 'stores');
    let node = nodes['page-search']; doc.activeElement = node;
    let initialShellWrites = shellWrites, initialResultWrites = resultWrites;
    input(node, 't'); input(node, 'ti'); input(node, 'tian');
    assert.equal(timers.size, 1); flush();
    assert.equal(A.filters.search, 'tian');
    assert.equal(shellWrites, initialShellWrites); assert.equal(resultWrites, initialResultWrites + 1);
    assert.equal(nodes['page-search'], node); assert.equal(doc.activeElement, node); assert.equal(node.value, 'tian'); assert.equal(focusCalls, 0);
    pass('连续字母输入只刷新结果，保留输入节点、焦点与字符');

    initialResultWrites = resultWrites;
    docEvents.get('compositionstart')({ target: node });
    input(node, 'tianl', true); input(node, 'tianlun', false); flush();
    assert.equal(resultWrites, initialResultWrites); assert.equal(A.filters.search, 'tian');
    A.render(); assert.equal(shellWrites, initialShellWrites); assert.equal(nodes['page-search'], node);
    pass('组字期间不搜索或重建输入框，包括isComposing错误为false的输入事件');

    node.value = '天伦'; docEvents.get('compositionend')({ target: node });
    input(node, '天伦', false); assert.equal(timers.size, 1); flush();
    assert.equal(A.filters.search, '天伦'); assert.equal(resultWrites, initialResultWrites + 1);
    assert.ok(nodes.main.lastResults[0].html.includes('<h2>天伦路店</h2>'));
    assert.ok(!nodes.main.lastResults[0].html.includes('<h2>荆胡店</h2>'));
    assert.equal(node.value, '天伦'); assert.equal(nodes['page-search'], node);
    pass('中文选词完成与随后input事件合并为一次准确搜索');

    input(node, ''); flush();
    assert.equal(A.filters.search, ''); assert.ok(nodes.main.lastResults[0].html.includes('<h2>荆胡店</h2>'));
    pass('清空搜索恢复门店列表，不重新挂载输入框');

    const filter = { dataset: { filter: 'brand' }, value: '江玖玖江西小炒', closest: () => null };
    await docEvents.get('change')({ target: filter });
    assert.equal(nodes['page-search'], node); assert.equal(shellWrites, initialShellWrites);
    assert.ok(nodes.main.lastResults[0].html.includes('<h2>岗杜街店</h2>'));
    assert.ok(!nodes.main.lastResults[0].html.includes('<h2>天伦路店</h2>'));
    pass('品牌筛选保留搜索框，结果同时响应筛选');

    initialResultWrites = resultWrites;
    input(node, '未提交'); context.location.hash = '#personnel'; windowEvents.get('hashchange')();
    assert.equal(timers.size, 0); flush(); assert.equal(A.route, 'personnel');
    assert.equal(resultWrites, initialResultWrites); assert.notEqual(nodes['page-search'], node);
    pass('切换模块取消旧搜索，避免迟到结果覆盖新页面');
    console.log('手机搜索输入回归验证完成。');
})().catch(error => { console.error(error); process.exitCode = 1; });
