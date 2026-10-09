(function () {
    'use strict';
    const A = window.Inspect;
    const clone = value => JSON.parse(JSON.stringify(value));
    const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const uid = prefix => prefix + '-' + (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
    const emptyState = () => ({ schemaVersion: 2, stores: clone(A.data.stores), inspections: [], issues: [], personnel: [], supports: [], reports: [], settings: { name: '江欢欢', company: '郑州市江欢欢餐饮咨询有限公司', department: '运营部' }, updatedAt: new Date().toISOString() });
    const store = id => A.state.stores.find(item => item.id === id);
    const storeName = id => (store(id) || {}).name || '已删除门店';
    const score = record => {
        const checked = record.checks.filter(item => item.value !== '未检查');
        if (!checked.length) return null;
        return Math.round(checked.reduce((sum, item) => sum + ({ '合格': 1, '待改善': 0.5, '不合格': 0 }[item.value] || 0), 0) / checked.length * 100);
    };
    const isOpen = issue => issue.status !== '已完成';
    const overdue = issue => isOpen(issue) && !!issue.deadline && issue.deadline < localDate();
    const staffing = (storeId, role) => {
        const s = store(storeId);
        const target = Number((s && s.targets[role]) || 0);
        const actual = A.state.personnel.filter(p => p.storeId === storeId && p.role === role && p.status === '在职').length;
        return { target, actual, gap: Math.max(0, target - actual) };
    };
    const totalGap = role => A.state.stores.filter(s => s.status !== '暂停营业').reduce((sum, s) => sum + staffing(s.id, role).gap, 0);
    const weekRange = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        start.setDate(start.getDate() - (start.getDay() + 6) % 7);
        const end = new Date(start); end.setDate(end.getDate() + 6);
        return { start: localDate(start), end: localDate(end) };
    };
    const dateValue = value => {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const [y, m, d] = value.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
    };
    const validate = state => {
        if (!state || state.schemaVersion !== 2) throw new Error('备份版本不支持，请选择本系统导出的 JSON 备份。');
        const tables = ['stores', 'inspections', 'issues', 'personnel', 'supports', 'reports'];
        for (const table of tables) {
            if (!Array.isArray(state[table])) throw new Error('备份缺少数据表：' + table);
            const ids = new Set();
            for (const row of state[table]) {
                if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id)) throw new Error('备份中存在无效或重复记录。');
                ids.add(row.id);
            }
        }
        const stores = new Set(state.stores.map(s => s.id));
        const requireText = (row, names) => names.forEach(name => {
            if (typeof row[name] !== 'string') throw new Error('备份文本字段格式无效：' + name);
        });
        for (const s of state.stores) {
            requireText(s, ['name', 'brand', 'status', 'address', 'manager', 'phone', 'openingDate', 'notes']);
            if (typeof s.name !== 'string' || !s.name.trim() || !A.data.brands.includes(s.brand) || !['营业中', '筹备中', '暂停营业'].includes(s.status) || !s.targets) throw new Error('备份中的门店信息无效。');
            for (const role of A.data.roles) if (!Number.isInteger(s.targets[role]) || s.targets[role] < 0) throw new Error('门店编制人数无效。');
        }
        for (const table of ['inspections', 'issues', 'personnel', 'supports']) for (const row of state[table]) {
            if (row.storeId && !stores.has(row.storeId)) throw new Error('备份中有记录关联了不存在的门店。');
        }
        for (const row of state.inspections) {
            requireText(row, ['storeId', 'date', 'inspector', 'summary', 'createdAt']);
            if (!stores.has(row.storeId) || !dateValue(row.date) || !row.inspector.trim() || !Array.isArray(row.checks) || !Array.isArray(row.photos) || row.photos.length > 6) throw new Error('巡店记录格式无效。');
            for (const c of row.checks) if (!A.data.checklist.some(item => item.id === c.id) || !['未检查', '合格', '待改善', '不合格'].includes(c.value)) throw new Error('巡店检查项无效。');
            for (const photo of row.photos) if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo)) throw new Error('照片数据无效。');
        }
        const inspections = new Set(state.inspections.map(i => i.id));
        for (const row of state.issues) {
            requireText(row, ['storeId', 'inspectionId', 'description', 'category', 'level', 'owner', 'deadline', 'status', 'solution', 'createdAt']);
            if (!stores.has(row.storeId) || !row.description.trim() || !['待整改', '整改中', '待复查', '已完成'].includes(row.status) || (row.deadline && !dateValue(row.deadline)) || (row.inspectionId && !inspections.has(row.inspectionId))) throw new Error('整改记录格式无效。');
            if (row.status === '已完成' && !row.solution.trim()) throw new Error('完成的整改缺少复查结论。');
        }
        for (const row of state.personnel) {
            requireText(row, ['name', 'role', 'status', 'storeId', 'phone', 'hireDate', 'notes']);
            if (!row.name.trim() || !A.data.roles.includes(row.role) || !['在职', '待分配', '离职'].includes(row.status) || (row.status === '在职' && !row.storeId) || !Array.isArray(row.history)) throw new Error('人员记录格式无效。');
            row.history.forEach(h => requireText(h, ['date', 'fromName', 'toName', 'status']));
        }
        for (const row of state.supports) {
            requireText(row, ['storeId', 'mentor', 'startDate', 'openingDate', 'status', 'notes', 'training', 'nextPlan', 'updatedDate', 'createdAt']);
            if (!stores.has(row.storeId) || !row.stages || !['进行中', '已完成', '暂停'].includes(row.status) || A.data.stages.some((_, i) => !['未开始', '进行中', '已完成'].includes(row.stages['stage-' + i]))) throw new Error('帮扶记录格式无效。');
            if (!row.mentor.trim() || (row.startDate && !dateValue(row.startDate)) || (row.openingDate && !dateValue(row.openingDate))) throw new Error('帮扶人或日期无效。');
            if (row.status === '已完成' && Object.values(row.stages).some(s => s !== '已完成')) throw new Error('帮扶还有未完成阶段。');
        }
        for (const row of state.reports) {
            requireText(row, ['name', 'supervisor', 'department', 'company', 'start', 'end', 'summary', 'problems', 'solutions', 'newStoreProgress', 'openingPlan', 'noSauceStores', 'topOrders', 'analysis', 'nextPlan', 'updatedAt']);
            if (!dateValue(row.start) || !dateValue(row.end) || row.start > row.end || !row.dayPlans || typeof row.dayPlans !== 'object') throw new Error('周报日期或工作计划格式无效。');
            if (!['元', '件', '箱', '公斤'].includes(row.ordersUnit || '元')) throw new Error('周报报货统计单位无效。');
            for (const name of ['ordersTotal', 'ordersSauce']) if (row[name] !== null && (typeof row[name] !== 'number' || !Number.isFinite(row[name]) || row[name] < 0)) throw new Error('周报报货量无效。');
            A.data.days.forEach((_, i) => { if (typeof row.dayPlans['day-' + i] !== 'string') throw new Error('周报每日计划无效。'); });
        }
        if (!state.settings || typeof state.settings.name !== 'string' || !state.settings.name.trim()) throw new Error('备份设置无效。');
        requireText(state.settings, ['name', 'company', 'department']);
        if (typeof state.updatedAt !== 'string' || !Number.isFinite(Date.parse(state.updatedAt))) throw new Error('备份保存时间无效。');
        return state;
    };
    const csv = rows => '\uFEFF' + rows.map(row => row.map(value => {
        let text = String(value == null ? '' : value);
        if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    }).join(',')).join('\r\n');
    A.core = { clone, localDate, uid, emptyState, store, storeName, score, isOpen, overdue, staffing, totalGap, weekRange, dateValue, validate, csv };
})();
