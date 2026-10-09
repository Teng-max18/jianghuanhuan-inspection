'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const context = { window: {}, console, Date, crypto: require('node:crypto').webcrypto };
vm.createContext(context);
for (const name of ['data.js', 'core.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', name), 'utf8'), context);
const A = context.window.Inspect, C = A.core;
A.state = C.emptyState();
const test = (name, fn) => { fn(); console.log('PASS ' + name); };
test('22家门店、两品牌与空业务记录', () => {
    assert.equal(A.state.stores.length, 22);
    assert.equal(A.state.stores.filter(s => s.brand === '江玖玖江西小炒').length, 2);
    assert.equal(A.state.inspections.length, 0); C.validate(A.state);
});
test('未检查项不参与评分，全部未查返回空', () => {
    assert.equal(C.score({ checks: [{ value: '合格' }, { value: '待改善' }, { value: '不合格' }, { value: '未检查' }] }), 50);
    assert.equal(C.score({ checks: [{ value: '未检查' }] }), null);
});
test('人员缺口按门店和在职岗位计算，不为负数', () => {
    A.state.stores[0].targets['厨师'] = 2;
    A.state.personnel = [{ storeId: 'store-01', role: '厨师', status: '在职' }, { storeId: 'store-01', role: '厨师', status: '待分配' }, { storeId: 'store-02', role: '厨师', status: '在职' }];
    assert.equal(C.staffing('store-01', '厨师').gap, 1);
    A.state.personnel.push({ storeId: 'store-01', role: '厨师', status: '在职' }, { storeId: 'store-01', role: '厨师', status: '在职' });
    assert.equal(C.staffing('store-01', '厨师').gap, 0);
    A.state.stores[0].status = '暂停营业'; assert.equal(C.totalGap('厨师'), 0);
    A.state = C.emptyState();
});
test('期限当天不算逾期，已完成不算逾期', () => {
    assert.equal(C.overdue({ status: '待整改', deadline: C.localDate() }), false);
    assert.equal(C.overdue({ status: '待整改', deadline: '2000-01-01' }), true);
    assert.equal(C.overdue({ status: '已完成', deadline: '2000-01-01' }), false);
});
test('有效日期与闰年边界', () => {
    assert.equal(C.dateValue('2024-02-29'), true);
    assert.equal(C.dateValue('2026-02-29'), false);
    assert.equal(C.dateValue('2026-13-10'), false);
    assert.equal(C.dateValue('2026-2-1'), false);
});
test('备份拒绝重复ID、无效关联与字段类型', () => {
    const bad = C.clone(A.state); bad.stores.push(C.clone(bad.stores[0])); assert.throws(() => C.validate(bad));
    const bad2 = C.clone(A.state); bad2.settings.name = {}; assert.throws(() => C.validate(bad2));
    const bad3 = C.clone(A.state); bad3.issues.push({ id: 'test', storeId: 'missing' }); assert.throws(() => C.validate(bad3));
});
test('CSV含BOM，转义引号、换行及公式前缀', () => {
    const out = C.csv([['=2+2', 'a"b', '第一行\n第二行']]);
    assert.ok(out.startsWith('\uFEFF')); assert.ok(out.includes("'=")); assert.ok(out.includes('a""b')); assert.ok(out.includes('第一行\n第二行'));
});
console.log('核心逻辑验证完成。');
