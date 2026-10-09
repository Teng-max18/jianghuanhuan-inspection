(function () {
    'use strict';
    const A = window.Inspect, U = A.ui, C = A.core;
    A.pages.personnel = () => {
        const items = A.state.personnel.filter(p => (!A.filters.search || (p.name + p.role + C.storeName(p.storeId) + p.phone).includes(A.filters.search)) && (!A.filters.role || p.role === A.filters.role) && (!A.filters.status || p.status === A.filters.status));
        const vacant = A.state.stores.filter(s => s.status !== '暂停营业' && A.data.roles.some(r => C.staffing(s.id, r).gap > 0));
        return U.header('人员 / TEAM', '人员与调配', '人员档案、门店分配及岗位缺口', U.button('新增人员', 'person-new', '', 'primary', 'plus')) + `<div class="mini-metrics"><div><span>在职人员</span><strong>${A.state.personnel.filter(p => p.status === '在职').length}<small>人</small></strong></div><div><span>待分配</span><strong>${A.state.personnel.filter(p => p.status === '待分配').length}<small>人</small></strong></div><div><span>厨师缺口</span><strong>${C.totalGap('厨师')}<small>人</small></strong></div><div><span>服务员缺口</span><strong>${C.totalGap('服务员')}<small>人</small></strong></div></div>` + U.search('搜索姓名、岗位、门店或电话', `<select data-filter="role" aria-label="岗位筛选">${U.options([{ id: '', name: '全部岗位' }].concat(A.data.roles), A.filters.role)}</select><select data-filter="status" aria-label="人员状态">${U.options([{ id: '', name: '全部状态' }].concat(['在职', '待分配', '离职']), A.filters.status)}</select>${U.button('导出 CSV', 'person-export', '', 'secondary', 'download')}`) + `<div class="dashboard-grid"><section class="panel"><div class="section-heading"><h2>人员档案</h2><span class="muted">${items.length} 人</span></div>${items.map(p => `<button class="record-row" data-action="person-view" data-id="${U.esc(p.id)}"><span class="avatar">${U.esc(p.name.slice(0, 1))}</span><span class="record-body"><strong>${U.esc(p.name)} <small class="inline-role">${U.esc(p.role)}</small></strong><small>${p.storeId ? U.esc(C.storeName(p.storeId)) : '暂未分配门店'} · ${U.esc(p.phone || '未填写电话')}</small></span>${U.badge(p.status)}${U.icon('arrow', 17)}</button>`).join('') || U.empty('还没有符合条件的人员', '新增人员', 'person-new', 'personnel')}</section><section class="panel"><div class="section-heading"><h2>门店缺口</h2><a href="#stores">设置编制 ${U.icon('arrow', 15)}</a></div>${vacant.length ? vacant.map(s => `<button class="gap-row" data-action="store-view" data-id="${U.esc(s.id)}"><strong>${U.esc(s.name)}</strong><span>${A.data.roles.filter(r => C.staffing(s.id, r).gap > 0).map(r => U.badge(r + '缺' + C.staffing(s.id, r).gap + '人', 'amber')).join(' ')}</span></button>`).join('') : '<div class="inline-empty">暂无已设置的岗位缺口。请在门店资料中填写所需编制人数。</div>'}<div class="note">在职并已分配门店的人员计入实有人数。离职、待分配人员不计入。</div></section></div>`;
    };
    function editor(id) {
        const row = A.state.personnel.find(p => p.id === id) || { name: '', role: '厨师', status: '待分配', storeId: '', history: [] };
        U.modal(id ? '编辑 / 调配人员' : '新增人员', `<div class="form-grid">${U.field('姓名 *', 'name', row.name, 'text', 'required maxlength="60"')}${U.select('岗位', 'role', A.data.roles, row.role)}${U.select('状态', 'status', ['在职', '待分配', '离职'], row.status)}${U.storeSelect('storeId', row.storeId, true)}${U.field('联系电话', 'phone', row.phone, 'tel')}${U.field('入职日期', 'hireDate', row.hireDate, 'date')}</div>${U.area('备注 / 调配说明', 'notes', row.notes)}<p class="note">将状态设为“在职”并选择门店，才会计入门店实有人数。调店会自动保存调配记录。</p>`, 'person', id);
    }
    A.actions['person-new'] = () => editor('');
    A.actions['person-edit'] = id => editor(id);
    A.actions['person-view'] = id => {
        const p = A.state.personnel.find(r => r.id === id); if (!p) return;
        U.modal(p.name + ' · 人员档案', `<p>${U.badge(p.role)} ${U.badge(p.status)}</p>${U.details([['门店', p.storeId ? C.storeName(p.storeId) : '暂未分配'], ['电话', p.phone], ['入职日期', p.hireDate], ['备注', p.notes]])}<h3>调配记录</h3>${(p.history || []).length ? `<div class="timeline">${p.history.slice().reverse().map(h => `<div><strong>${U.esc(h.date)}</strong><p>${U.esc(h.fromName || '未分配')} → ${U.esc(h.toName || '未分配')} · ${U.esc(h.status)}</p></div>`).join('')}</div>` : '<p class="muted">暂无调配记录。</p>'}<div class="detail-actions">${U.button('编辑 / 调配', 'person-edit', id)}${U.button('删除人员', 'person-delete', id, 'danger')}</div>`);
    };
    A.forms.person = async (form, id) => {
        const v = Object.fromEntries(new FormData(form));
        if (v.status === '在职' && !v.storeId) throw new Error('在职人员请选择分配门店；暂未分配请使用“待分配”。');
        if (v.status === '待分配') v.storeId = '';
        await A.storage.transact(state => {
            const old = state.personnel.find(p => p.id === id);
            const history = (old && old.history) || [];
            if (!old || old.storeId !== v.storeId || old.status !== v.status) history.push({ date: C.localDate(), fromName: old && old.storeId ? C.storeName(old.storeId) : '', toName: v.storeId ? C.storeName(v.storeId) : '', status: v.status });
            const row = { id: id || C.uid('person'), name: v.name.trim(), role: v.role, status: v.status, storeId: v.storeId, phone: v.phone.trim(), hireDate: v.hireDate, notes: v.notes.trim(), history };
            const index = state.personnel.findIndex(p => p.id === id); if (index < 0) state.personnel.push(row); else state.personnel[index] = row;
        }); A.saved('人员档案已保存');
    };
    A.actions['person-delete'] = async id => {
        if (!confirm('确定删除人员档案与调配历史？保留离职记录请改为“离职”。')) return;
        await A.storage.transact(state => { state.personnel = state.personnel.filter(p => p.id !== id); }); A.saved('人员档案已删除');
    };
    A.actions['person-export'] = () => U.download('人员档案_' + C.localDate() + '.csv', C.csv([['姓名', '岗位', '状态', '门店', '电话', '入职日期', '备注']].concat(A.state.personnel.map(p => [p.name, p.role, p.status, p.storeId ? C.storeName(p.storeId) : '', p.phone, p.hireDate, p.notes]))), 'text/csv;charset=utf-8');
})();
