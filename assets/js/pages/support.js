(function () {
    'use strict';
    const A = window.Inspect, U = A.ui, C = A.core;
    const completed = row => A.data.stages.filter((_, i) => row.stages['stage-' + i] === '已完成').length;
    A.pages.support = () => {
        const rows = A.state.supports.filter(s => (!A.filters.search || (C.storeName(s.storeId) + s.mentor + s.training + s.notes).includes(A.filters.search)) && (!A.filters.status || s.status === A.filters.status));
        return U.header('新店 / SUPPORT', '新店帮扶', '跟踪装修、人员培训、物料准备及试营业', U.button('新增帮扶', 'support-new', '', 'primary', 'plus')) + U.search('搜索门店、帮扶人或帮扶内容', `<select data-filter="status" aria-label="帮扶状态">${U.options([{ id: '', name: '全部状态' }].concat(['进行中', '已完成', '暂停']), A.filters.status)}</select>`) + `<div class="store-grid">${rows.map(s => `<article class="store-card"><div class="section-heading"><span class="store-symbol">${U.icon('support', 26)}</span>${U.badge(s.status)}</div><p class="store-brand">新店进度跟进</p><h2>${U.esc(C.storeName(s.storeId))}</h2><p class="muted">帮扶人 ${U.esc(s.mentor)} · 计划开业 ${U.esc(s.openingDate || '待定')}</p><div class="progress-label"><strong>${Math.round(completed(s) / A.data.stages.length * 100)}%</strong><span>已完成 ${completed(s)} / ${A.data.stages.length} 项</span></div><div class="progress"><span style="width:${completed(s) / A.data.stages.length * 100}%"></span></div><p class="support-plan">${U.esc(s.nextPlan || '暂未填写后续计划')}</p><div class="card-actions">${U.button('查看进度', 'support-view', s.id, 'secondary')}${U.button('更新帮扶', 'support-edit', s.id, 'text-btn', 'arrow')}</div></article>`).join('') || U.empty('还没有新店帮扶记录', '新增帮扶', 'support-new', 'support')}</div>`;
    };
    function editor(id) {
        if (!A.state.stores.length) throw new Error('请先添加门店。');
        const row = A.state.supports.find(s => s.id === id) || { storeId: A.state.stores.find(s => s.status === '筹备中')?.id || A.state.stores[0].id, mentor: A.state.settings.name, startDate: C.localDate(), status: '进行中', stages: {} };
        U.modal(id ? '更新新店帮扶' : '新增新店帮扶', `<div class="form-grid">${U.storeSelect('storeId', row.storeId)}${U.field('帮扶人 *', 'mentor', row.mentor, 'text', 'required')}${U.field('开始日期', 'startDate', row.startDate, 'date')}${U.field('计划开业日期', 'openingDate', row.openingDate, 'date')}${U.select('帮扶状态', 'status', ['进行中', '已完成', '暂停'], row.status)}</div><h3 class="form-section">装修与开业进度</h3><div class="checklist">${A.data.stages.map((label, i) => `<div class="check-row"><strong>${i + 1}. ${label}</strong><select name="stage-${i}" aria-label="${label}">${U.options(['未开始', '进行中', '已完成'], row.stages['stage-' + i] || '未开始')}</select></div>`).join('')}</div>${U.area('帮扶内容 / 当前情况', 'notes', row.notes)}${U.area('人员培训情况', 'training', row.training)}${U.area('后续计划', 'nextPlan', row.nextPlan)}`, 'support', id);
    }
    A.actions['support-new'] = () => editor('');
    A.actions['support-edit'] = id => editor(id);
    A.actions['support-view'] = id => {
        const s = A.state.supports.find(r => r.id === id); if (!s) return;
        U.modal(C.storeName(s.storeId) + ' · 新店帮扶', `<p>${U.badge(s.status)}</p>${U.details([['帮扶人', s.mentor], ['开始日期', s.startDate], ['计划开业日期', s.openingDate], ['帮扶内容', s.notes], ['人员培训', s.training], ['后续计划', s.nextPlan]])}<h3>装修与开业进度</h3><div class="checklist">${A.data.stages.map((label, i) => `<div class="check-row"><strong>${label}</strong>${U.badge(s.stages['stage-' + i], s.stages['stage-' + i] === '已完成' ? 'green' : s.stages['stage-' + i] === '进行中' ? 'blue' : 'neutral')}</div>`).join('')}</div><div class="detail-actions">${U.button('更新帮扶', 'support-edit', id)}${U.button('删除记录', 'support-delete', id, 'danger')}</div>`);
    };
    A.forms.support = async (form, id) => {
        const v = Object.fromEntries(new FormData(form));
        const stages = Object.fromEntries(A.data.stages.map((_, i) => ['stage-' + i, v['stage-' + i]]));
        if (v.status === '已完成' && Object.values(stages).some(s => s !== '已完成')) throw new Error('还有未完成的开业进度，请逐项确认后再结束帮扶。');
        if (v.startDate && v.openingDate && v.startDate > v.openingDate) throw new Error('计划开业日期不能早于帮扶开始日期。');
        await A.storage.transact(state => {
            const old = state.supports.find(s => s.id === id);
            const row = { id: id || C.uid('support'), storeId: v.storeId, mentor: v.mentor.trim(), startDate: v.startDate, openingDate: v.openingDate, status: v.status, stages, notes: v.notes.trim(), training: v.training.trim(), nextPlan: v.nextPlan.trim(), updatedDate: C.localDate(), createdAt: old ? old.createdAt : new Date().toISOString() };
            const index = state.supports.findIndex(s => s.id === id); if (index < 0) state.supports.push(row); else state.supports[index] = row;
        }); A.saved('新店帮扶已保存');
    };
    A.actions['support-delete'] = async id => {
        if (!confirm('确定删除这条新店帮扶记录？')) return;
        await A.storage.transact(state => { state.supports = state.supports.filter(s => s.id !== id); }); A.saved('帮扶记录已删除');
    };
})();
