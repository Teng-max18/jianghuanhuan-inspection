'use strict';
// 业务测试在模拟浏览器API下运行真实业务代码，不代替真实浏览器的布局/安装测试。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const base = path.join(__dirname, '..');
const slots = new Map();
let quotaFailure = false;
const nodes = {
    editor: { innerHTML: '', open: false, showModal() { this.open = true; }, close() { this.open = false; }, querySelector() { return { disabled: false, setAttribute() {} }; }, contains() { return true; } },
    'draft-photos': { innerHTML: '' }, toast: { textContent: '', className: '' }
};
class Data { constructor(form) { this.items = Object.entries(form.values); } [Symbol.iterator]() { return this.items[Symbol.iterator](); } }
const context = {
    window: {}, console, Date, URL, Blob, FormData: Data,
    crypto: require('node:crypto').webcrypto,
    location: { href: 'https://example.test/inspection/index.html' },
    navigator: {},
    localStorage: { getItem: key => slots.get(key) || null, setItem: (key, value) => { if (quotaFailure) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } slots.set(key, value); } },
    document: { getElementById: id => nodes[id], body: { appendChild() {} }, createElement: () => ({ click() {}, remove() {} }) },
    confirm: () => true, setTimeout: () => 0, clearTimeout() {}
};
vm.createContext(context);
for (const file of ['data.js', 'core.js', 'storage.js', 'ui.js', 'pages/home.js', 'pages/stores.js', 'pages/inspections.js', 'pages/personnel.js', 'pages/support.js', 'pages/weekly.js', 'pages/settings.js']) vm.runInContext(fs.readFileSync(path.join(base, 'assets/js', file), 'utf8'), context, { filename: file });
const A = context.window.Inspect, C = A.core;
A.filters = {};
A.saved = () => {};
A.render = () => {};
const form = values => ({ values });
const run = async (name, fn) => { await fn(); console.log('PASS ' + name); };
(async () => {
    await A.storage.init();
    await run('浏览器存储不可用时使用备用存储，重开可读取', async () => {
        assert.equal(A.storage.mode(), 'localStorage');
        assert.equal(A.state.stores.length, 22); await A.storage.init(); assert.equal(A.state.stores.length, 22);
    });
    await run('门店维护编制、重复名称校验与搜索', async () => {
        const s = A.state.stores[0];
        await A.forms.store(form({ name: s.name, brand: s.brand, status: '营业中', manager: '王店长', phone: '13000000000', address: '测试地址', openingDate: C.localDate(), notes: '测试', ...Object.fromEntries(A.data.roles.map(r => ['target-' + r, r === '厨师' ? '2' : r === '服务员' ? '1' : '0'])) }), s.id);
        assert.equal(C.totalGap('厨师'), 2);
        await assert.rejects(A.forms.store(form({ name: s.name, brand: s.brand }), ''), /已存在/);
        A.filters = { search: '天伦路' }; const html = A.pages.stores(); assert.ok(html.includes('天伦路店')); assert.ok(!html.includes('<h2>荆胡店</h2>')); A.filters = {};
    });
    await run('人员保存、调配历史与门店缺口更新', async () => {
        await A.forms.person(form({ name: '测试厨师', role: '厨师', status: '在职', storeId: 'store-01', phone: '', hireDate: C.localDate(), notes: '' }), '');
        assert.equal(C.totalGap('厨师'), 1);
        const id = A.state.personnel[0].id;
        await A.forms.person(form({ name: '测试厨师', role: '厨师', status: '在职', storeId: 'store-02', phone: '', hireDate: C.localDate(), notes: '调配测试' }), id);
        assert.equal(C.staffing('store-01', '厨师').gap, 2); assert.equal(A.state.personnel[0].history.length, 2);
        await assert.rejects(A.forms.person(form({ name: '待分配人员', role: '厨师', status: '在职', storeId: '' }), ''), /请选择/);
    });
    await run('巡店与关联问题真实保存，评分可查询', async () => {
        A.actions['inspection-new']('store-01');
        await A.forms.inspection(form({ storeId: 'store-01', date: C.localDate(), inspector: '江欢欢', summary: '测试巡店总结', ...Object.fromEntries(A.data.checklist.map(c => ['check-' + c.id, '合格'])), issueDescription: '后厨卫生需改善', issueLevel: '重要', issueOwner: '王店长', issueDeadline: '2000-01-01' }), '');
        assert.equal(A.state.inspections.length, 1); assert.equal(C.score(A.state.inspections[0]), 100); assert.equal(A.state.issues.length, 1); assert.equal(C.overdue(A.state.issues[0]), true);
        await A.storage.init(); assert.equal(A.state.inspections[0].summary, '测试巡店总结');
    });
    await run('完成整改需结论，更新后消除逾期', async () => {
        const row = A.state.issues[0];
        const values = { inspectionId: row.inspectionId, storeId: row.storeId, description: row.description, category: row.category, level: row.level, status: '已完成', owner: row.owner, deadline: row.deadline, solution: '' };
        await assert.rejects(A.forms.issue(form(values), row.id), /复查结论/);
        values.solution = '完成清洁并复查合格'; await A.forms.issue(form(values), row.id);
        assert.equal(A.state.issues[0].status, '已完成'); assert.equal(C.overdue(A.state.issues[0]), false);
    });
    await run('新店14阶段保存与完整性校验', async () => {
        const values = { storeId: 'store-01', mentor: '江欢欢', startDate: C.localDate(), openingDate: '', status: '进行中', notes: '测试帮扶', training: '完成培训', nextPlan: '跟进设备', ...Object.fromEntries(A.data.stages.map((_, i) => ['stage-' + i, i < 3 ? '已完成' : '未开始'])) };
        await A.forms.support(form(values), ''); assert.equal(Object.keys(A.state.supports[0].stages).length, 14);
        values.status = '已完成'; await assert.rejects(A.forms.support(form(values), A.state.supports[0].id), /未完成/);
    });
    await run('周报摘要包含真实巡店、整改与帮扶，保存独立快照', async () => {
        A.actions['weekly-new'](); const html = nodes.editor.innerHTML;
        assert.ok(html.includes('测试巡店总结')); assert.ok(html.includes('后厨卫生需改善')); assert.ok(html.includes('完成清洁并复查合格')); assert.ok(html.includes('测试帮扶'));
        const range = C.weekRange();
        await A.forms.weekly(form({ name: '测试周报', supervisor: '江欢欢', start: range.start, end: range.end, department: '运营部', company: '江欢欢', summary: '巡店总结快照', problems: '问题', solutions: '方案', newStoreProgress: '新店', openingPlan: '', ordersUnit: '箱', ordersTotal: '100', ordersSauce: '', noSauceStores: '', topOrders: '', analysis: '分析', nextPlan: '计划', ...Object.fromEntries(A.data.days.map((_, i) => ['day-' + i, '工作计划'])) }), '');
        assert.equal(A.state.reports[0].ordersTotal, 100); assert.equal(A.state.reports[0].ordersSauce, null); assert.equal(A.state.reports[0].ordersUnit, '箱');
        await A.storage.transact(state => { state.inspections[0].summary = '后续修改'; }); assert.equal(A.state.reports[0].summary, '巡店总结快照');
    });
    await run('保存失败不污染已保存状态', async () => {
        const old = A.state.settings.name; quotaFailure = true;
        await assert.rejects(A.storage.transact(state => { state.settings.name = '失败不应生效'; }), /存储空间不足/);
        quotaFailure = false; assert.equal(A.state.settings.name, old);
    });
    await run('备份结构拒绝破损数据，导入能恢复原记录与照片', async () => {
        await A.storage.transact(state => { state.inspections[0].photos = ['data:image/jpeg;base64,/9j/']; });
        const snapshot = C.clone(A.state);
        const data = JSON.stringify({ format: 'jianghuanhuan-inspection', data: snapshot });
        await A.storage.transact(state => { Object.assign(state, C.emptyState()); }); assert.equal(A.state.inspections.length, 0);
        await A.importBackup({ files: [{ size: data.length, text: async () => data }], value: '' });
        assert.equal(A.state.inspections.length, 1); assert.equal(A.state.personnel.length, 1); assert.equal(A.state.inspections[0].photos[0], 'data:image/jpeg;base64,/9j/');
        const bad = C.clone(snapshot); bad.inspections[0].photos = ['javascript:alert(1)']; assert.throws(() => C.validate(bad), /照片/);
        await assert.rejects(A.importBackup({ files: [{ size: 3, text: async () => 'bad' }], value: '' }), /有效/);
    });
    await run('所有业务页面能用已保存数据生成，文本防HTML注入', async () => {
        await A.storage.transact(state => { state.inspections[0].summary = '<img src=x onerror=alert(1)>'; });
        for (const [name, renderer] of Object.entries(A.pages)) { const html = renderer(); assert.ok(html.length > 50, name); assert.ok(!html.includes('<img src=x onerror=alert(1)>'), name); }
    });
    await run('删除巡店保留整改，门店关联记录阻止删除', async () => {
        const id = A.state.inspections[0].id;
        await assert.rejects(A.actions['store-delete']('store-01'), /已有业务记录/);
        await A.actions['inspection-delete'](id); assert.equal(A.state.inspections.length, 0); assert.equal(A.state.issues.length, 1); assert.equal(A.state.issues[0].inspectionId, '');
    });
    console.log('业务保存、修改、恢复与失败路径验证完成。');
})().catch(error => { console.error(error); process.exitCode = 1; });
