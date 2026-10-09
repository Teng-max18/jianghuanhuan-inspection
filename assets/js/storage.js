(function () {
    'use strict';
    const A = window.Inspect;
    const KEY = 'jianghuanhuan-inspection-v2-' + new URL('.', location.href).pathname;
    let database = null;
    let mode = 'indexedDB';
    function open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(KEY, 1);
            request.onupgradeneeded = () => request.result.createObjectStore('records');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onblocked = () => reject(new Error('数据库被其他页面占用，请关闭其他巡店页面。'));
        });
    }
    function read() {
        return new Promise((resolve, reject) => {
            const req = database.transaction('records', 'readonly').objectStore('records').get('state');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    function write(state) {
        if (mode === 'localStorage') {
            localStorage.setItem(KEY, JSON.stringify(state));
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('records', 'readwrite');
            transaction.objectStore('records').put(state, 'state');
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error || new Error('保存被中断。'));
        });
    }
    // 旧版与当前站点同源时迁移巡店文字记录；无法找回旧版未保存的照片。
    function migrateLegacy() {
        const state = A.core.emptyState();
        let old = null;
        try {
            const raw = localStorage.getItem('db');
            if (raw) old = JSON.parse(raw).inspection;
            if (!Array.isArray(old)) old = JSON.parse(localStorage.getItem('inspection') || '[]');
        } catch (_) { return state; }
        for (const row of old || []) {
            const store = state.stores.find(s => s.name === (row.store || row.shop));
            if (!store) continue;
            const d = String(row.date || '').replace(/\//g, '-');
            const parts = d.split('-');
            const normalized = parts.length === 3 ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}` : '';
            const id = A.core.uid('inspection');
            state.inspections.push({ id, storeId: store.id, date: A.core.dateValue(normalized) ? normalized : A.core.localDate(), inspector: '旧版导入', checks: A.data.checklist.map(c => ({ id: c.id, value: '未检查' })), summary: String(row.problem || ''), photos: [], createdAt: new Date().toISOString() });
            if (row.problem) state.issues.push({ id: A.core.uid('issue'), inspectionId: id, storeId: store.id, description: String(row.problem), category: '其他', level: '一般', owner: '', deadline: '', status: '待整改', solution: '', createdAt: new Date().toISOString() });
        }
        return state;
    }
    async function init() {
        let state;
        try { database = await open(); state = await read(); }
        catch (_) { mode = 'localStorage'; state = JSON.parse(localStorage.getItem(KEY) || 'null'); }
        if (!state) {
            let fallback = null;
            try { fallback = localStorage.getItem(KEY); } catch (_) { /* IndexedDB可用时允许本地存储被禁用。 */ }
            state = fallback ? JSON.parse(fallback) : migrateLegacy();
        }
        A.core.validate(state);
        await write(state);
        A.state = state;
        return { mode };
    }
    let busy = false;
    async function transact(mutator) {
        if (busy) throw new Error('上一条记录正在保存，请稍后重试。');
        busy = true;
        try {
            const operation = async () => {
                const current = mode === 'indexedDB' ? await read() : JSON.parse(localStorage.getItem(KEY) || 'null');
                if (current) A.state = A.core.validate(current);
                const next = A.core.clone(A.state);
                await mutator(next);
                next.updatedAt = new Date().toISOString();
                A.core.validate(next);
                await write(next);
                A.state = next;
            };
            if (navigator.locks && navigator.locks.request) await navigator.locks.request(KEY, operation);
            else await operation();
        } catch (error) {
            if (error && error.name === 'QuotaExceededError') throw new Error('存储空间不足，记录未保存。请先导出备份，再减少照片。');
            throw error;
        } finally { busy = false; }
    }
    A.storage = { init, transact, mode: () => mode };
})();
