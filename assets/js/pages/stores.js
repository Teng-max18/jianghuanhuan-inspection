(function () {
    'use strict';
    const A = window.Inspect, U = A.ui, C = A.core;
    A.pages.stores = () => {
        const items = A.state.stores.filter(s => (!A.filters.search || (s.name + s.brand + s.manager + s.address).includes(A.filters.search)) && (!A.filters.brand || s.brand === A.filters.brand) && (!A.filters.status || s.status === A.filters.status));
        return U.header('门店 / STORES', '门店管理', '维护门店资料、负责人及岗位编制', U.button('新增门店', 'store-new', '', 'primary', 'plus')) + U.search('搜索门店、负责人或地址', `<select data-filter="brand" aria-label="品牌筛选">${U.options([{ id: '', name: '全部品牌' }].concat(A.data.brands), A.filters.brand)}</select><select data-filter="status" aria-label="营业状态">${U.options(['全部状态', '营业中', '筹备中', '暂停营业'].map(x => ({ id: x === '全部状态' ? '' : x, name: x })), A.filters.status)}</select>`) + `<p class="list-count">共 ${items.length} 家门店</p><div class="store-grid">${items.map(s => {
            const latest = A.state.inspections.filter(i => i.storeId === s.id).sort((a, b) => b.date.localeCompare(a.date))[0];
            const open = A.state.issues.filter(i => i.storeId === s.id && C.isOpen(i)).length;
            return `<article class="store-card"><div class="store-card-top"><span class="store-symbol">${U.icon('stores', 26)}</span>${U.badge(s.status)}</div><p class="store-brand">${U.esc(s.brand)}</p><h2>${U.esc(s.name)}</h2><p class="muted">${U.esc(s.address || '地址待填写')}</p><div class="store-stats"><span><small>最近巡店</small><strong>${latest ? U.esc(latest.date.slice(5)) : '未巡店'}</strong></span><span><small>待整改</small><strong class="${open ? 'danger-text' : ''}">${open} 项</strong></span><span><small>厨师 / 服务员缺口</small><strong>${C.staffing(s.id, '厨师').gap} / ${C.staffing(s.id, '服务员').gap}</strong></span></div><div class="card-actions">${U.button('门店详情', 'store-view', s.id, 'secondary')}${U.button('去巡店', 'inspection-new', s.id, 'text-btn', 'arrow')}</div></article>`;
        }).join('') || U.empty('没有找到门店', '新增门店', 'store-new', 'stores')}</div>`;
    };
    function editor(id) {
        const row = C.store(id) || { name: '', brand: A.data.brands[0], status: '筹备中', targets: {} };
        U.modal(id ? '编辑门店' : '新增门店', `<div class="form-grid">${U.field('门店名称 *', 'name', row.name, 'text', 'required maxlength="80"')}${U.select('品牌', 'brand', A.data.brands, row.brand)}${U.select('营业状态', 'status', ['营业中', '筹备中', '暂停营业'], row.status)}${U.field('开业日期', 'openingDate', row.openingDate, 'date')}${U.field('负责人', 'manager', row.manager)}${U.field('联系电话', 'phone', row.phone, 'tel')}${U.field('门店地址', 'address', row.address, 'text', 'maxlength="300"')}</div><h3 class="form-section">岗位编制</h3><p class="muted">填写所需人数，与在职人员对比计算缺口。0 表示未设置需求。</p><div class="form-grid">${A.data.roles.map(role => U.field(role, 'target-' + role, row.targets[role] || 0, 'number', 'min="0" max="1000" step="1" required')).join('')}</div>${U.area('备注', 'notes', row.notes)}`, 'store', id);
    }
    A.actions['store-new'] = () => editor('');
    A.actions['store-edit'] = id => editor(id);
    A.actions['store-view'] = id => {
        const s = C.store(id); if (!s) return;
        U.modal(s.name, `<p class="muted">${U.esc(s.brand)} ${U.badge(s.status)}</p>${U.details([['负责人', s.manager], ['联系电话', s.phone], ['门店地址', s.address], ['开业日期', s.openingDate], ['备注', s.notes]])}<h3>岗位与缺口</h3><div class="table-wrap"><table><thead><tr><th>岗位</th><th>编制</th><th>在职</th><th>缺口</th></tr></thead><tbody>${A.data.roles.map(role => { const r = C.staffing(id, role); return `<tr><td>${role}</td><td>${r.target || '未设置'}</td><td>${r.actual}</td><td>${r.gap}</td></tr>`; }).join('')}</tbody></table></div><div class="detail-actions">${U.button('编辑资料', 'store-edit', id)}${U.button('开始巡店', 'inspection-new', id, 'secondary')}${U.button('删除门店', 'store-delete', id, 'danger')}</div>`);
    };
    A.forms.store = async (form, id) => {
        const values = Object.fromEntries(new FormData(form));
        const name = values.name.trim();
        if (A.state.stores.some(s => s.id !== id && s.name === name && s.brand === values.brand)) throw new Error('同一品牌下已存在此门店。');
        const targets = Object.fromEntries(A.data.roles.map(r => [r, Number(values['target-' + r])]));
        await A.storage.transact(state => {
            const row = { id: id || C.uid('store'), name, brand: values.brand, status: values.status, manager: values.manager.trim(), phone: values.phone.trim(), address: values.address.trim(), openingDate: values.openingDate, targets, notes: values.notes.trim() };
            const index = state.stores.findIndex(s => s.id === id);
            if (index < 0) state.stores.push(row); else state.stores[index] = row;
        });
        A.saved('门店资料已保存');
    };
    A.actions['store-delete'] = async id => {
        if (['inspections', 'issues', 'personnel', 'supports'].some(table => A.state[table].some(r => r.storeId === id))) throw new Error('该门店已有业务记录。请将营业状态设为“暂停营业”以保留历史。');
        if (!confirm('确定删除这家门店？')) return;
        await A.storage.transact(state => { state.stores = state.stores.filter(s => s.id !== id); });
        A.saved('门店已删除');
    };
})();
