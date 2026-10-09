(function () {
    'use strict';
    const A = window.Inspect, U = A.ui, C = A.core;
    let draftPhotos = [];
    A.pages.inspections = () => {
        const rows = A.state.inspections.filter(i => (!A.filters.search || (C.storeName(i.storeId) + i.inspector + i.summary).includes(A.filters.search)) && (!A.filters.storeId || i.storeId === A.filters.storeId)).slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
        return U.header('巡店 / INSPECTIONS', '巡店记录', '检查门店、保存现场照片、跟进发现的问题', U.button('新增巡店', 'inspection-new', '', 'primary', 'plus')) + U.search('搜索门店、巡店人或情况说明', `<select data-filter="storeId" aria-label="门店筛选">${U.options([{ id: '', name: '全部门店' }].concat(A.state.stores), A.filters.storeId)}</select>${U.button('导出 CSV', 'inspection-export', '', 'secondary', 'download')}`) + `<p class="list-count">共 ${rows.length} 条记录</p><section class="panel records">${rows.map(i => `<button class="record-row" data-action="inspection-view" data-id="${U.esc(i.id)}"><span class="record-icon">${U.icon('inspections')}</span><span class="record-body"><strong>${U.esc(C.storeName(i.storeId))}</strong><small>${U.esc(i.date)} · ${U.esc(i.inspector)} · ${i.photos.length} 张照片</small><p>${U.esc(i.summary || '暂无情况说明')}</p></span><span class="record-score ${C.score(i) !== null && C.score(i) < 60 ? 'danger-text' : ''}">${C.score(i) === null ? '未评分' : C.score(i) + ' 分'}</span>${U.icon('arrow', 17)}</button>`).join('') || U.empty('还没有巡店记录', '新增巡店', 'inspection-new')}</section>`;
    };
    function inspectionEditor(id, storeId) {
        if (!A.state.stores.length) throw new Error('请先添加门店。');
        const row = A.state.inspections.find(i => i.id === id) || { storeId: storeId || A.state.stores[0].id, date: C.localDate(), inspector: A.state.settings.name, checks: A.data.checklist.map(c => ({ id: c.id, value: '未检查' })), summary: '', photos: [] };
        draftPhotos = row.photos.slice();
        U.modal(id ? '编辑巡店记录' : '新增巡店', `<div class="form-grid">${U.storeSelect('storeId', row.storeId)}${U.field('巡店日期 *', 'date', row.date, 'date', 'required')}${U.field('巡店人 *', 'inspector', row.inspector, 'text', 'required maxlength="60"')}</div><h3 class="form-section">门店检查</h3><p class="muted">未检查项不计入评分；合格 100%、待改善 50%、不合格 0%。</p><div class="checklist">${A.data.checklist.map(c => `<div class="check-row"><div><small>${c.group}</small><strong>${c.label}</strong></div><select name="check-${c.id}" aria-label="${c.label}">${U.options(['未检查', '合格', '待改善', '不合格'], (row.checks.find(x => x.id === c.id) || {}).value || '未检查')}</select></div>`).join('')}</div>${U.area('情况说明 / 工作总结', 'summary', row.summary, 'maxlength="5000"')}<h3 class="form-section">现场照片</h3><p class="muted">最多 6 张，自动压缩后保存在本设备；单张原图限 15 MB。</p><label class="upload-box">${U.icon('camera', 24)}<span>拍照或选择照片</span><input type="file" id="photo-input" accept="image/jpeg,image/png,image/webp" multiple></label><div id="draft-photos" class="photo-grid"></div>${id ? '<p class="note">整改问题在“整改跟踪”中单独更新，避免覆盖历史处理结果。</p>' : `<h3 class="form-section">发现问题（可选）</h3><p class="muted">填写后会同步创建一条待整改任务；其他问题可在整改页继续添加。</p>${U.area('问题描述', 'issueDescription', '')}<div class="form-grid">${U.select('问题等级', 'issueLevel', ['一般', '重要', '紧急'], '一般')}${U.field('整改负责人', 'issueOwner')}${U.field('整改期限', 'issueDeadline', '', 'date')}</div>`}`, 'inspection', id);
        renderPhotos();
    }
    function renderPhotos() {
        const el = document.getElementById('draft-photos'); if (!el) return;
        el.innerHTML = draftPhotos.map((src, index) => `<div class="draft-photo"><img src="${U.esc(src)}" alt="待保存现场照片"><button type="button" data-action="photo-remove" data-id="${index}" aria-label="删除照片">${U.icon('close', 15)}</button></div>`).join('');
    }
    A.actions['photo-remove'] = index => { draftPhotos.splice(Number(index), 1); renderPhotos(); };
    A.actions['inspection-new'] = storeId => inspectionEditor('', storeId);
    A.actions['inspection-edit'] = id => inspectionEditor(id);
    A.actions['inspection-view'] = id => {
        const row = A.state.inspections.find(i => i.id === id); if (!row) return;
        U.modal(C.storeName(row.storeId) + ' · 巡店记录', `${U.details([['巡店日期', row.date], ['巡店人', row.inspector], ['检查分数', C.score(row) === null ? '未检查，暂无评分' : C.score(row) + ' 分'], ['情况说明', row.summary]])}<div class="checklist">${A.data.checklist.map(c => `<div class="check-row"><strong>${c.label}</strong>${U.badge((row.checks.find(x => x.id === c.id) || {}).value || '未检查', ({ '合格': 'green', '待改善': 'amber', '不合格': 'red' }[(row.checks.find(x => x.id === c.id) || {}).value] || 'neutral'))}</div>`).join('')}</div>${U.photos(row.photos)}<h3>关联整改</h3>${A.state.issues.filter(i => i.inspectionId === id).map(i => `<button class="todo-row" data-action="issue-view" data-id="${U.esc(i.id)}"><span>${U.esc(i.description)}</span>${U.badge(i.status)}</button>`).join('') || '<p class="muted">暂无关联整改任务。</p>'}<div class="detail-actions">${U.button('编辑记录', 'inspection-edit', id)}${U.button('新增整改', 'issue-for-inspection', id, 'secondary')}${U.button('删除记录', 'inspection-delete', id, 'danger')}</div>`);
    };
    A.forms.inspection = async (form, id) => {
        if (A.photoBusy) throw new Error('照片还在处理中，请处理完成后保存。');
        const v = Object.fromEntries(new FormData(form));
        const checks = A.data.checklist.map(c => ({ id: c.id, value: v['check-' + c.id] }));
        await A.storage.transact(state => {
            const old = state.inspections.find(i => i.id === id);
            const row = { id: id || C.uid('inspection'), storeId: v.storeId, date: v.date, inspector: v.inspector.trim(), checks, summary: v.summary.trim(), photos: draftPhotos.slice(), createdAt: old ? old.createdAt : new Date().toISOString() };
            const index = state.inspections.findIndex(i => i.id === id);
            if (index < 0) state.inspections.push(row); else state.inspections[index] = row;
            if (id) state.issues.filter(i => i.inspectionId === id).forEach(i => { i.storeId = row.storeId; });
            if (!id && v.issueDescription.trim()) state.issues.push({ id: C.uid('issue'), inspectionId: row.id, storeId: row.storeId, description: v.issueDescription.trim(), category: '其他', level: v.issueLevel, owner: v.issueOwner.trim(), deadline: v.issueDeadline, status: '待整改', solution: '', createdAt: new Date().toISOString() });
        });
        A.saved('巡店记录已保存');
    };
    A.actions['inspection-delete'] = async id => {
        const linked = A.state.issues.filter(i => i.inspectionId === id);
        if (!confirm(`确定删除此巡店记录${linked.length ? '？关联整改会保留，并解除关联' : ''}？`)) return;
        await A.storage.transact(state => {
            state.inspections = state.inspections.filter(i => i.id !== id);
            state.issues.filter(i => i.inspectionId === id).forEach(i => { i.inspectionId = ''; });
        }); A.saved('巡店记录已删除');
    };
    A.actions['inspection-export'] = () => {
        const rows = [['门店', '品牌', '日期', '巡店人', '检查分数', '情况说明', '照片数量', '待整改数量']].concat(A.state.inspections.map(i => [C.storeName(i.storeId), C.store(i.storeId).brand, i.date, i.inspector, C.score(i), i.summary, i.photos.length, A.state.issues.filter(x => x.inspectionId === i.id && C.isOpen(x)).length]));
        U.download('巡店记录_' + C.localDate() + '.csv', C.csv(rows), 'text/csv;charset=utf-8');
    };
    async function compress(file) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 照片。');
        if (file.size > 15 * 1024 * 1024) throw new Error('单张照片不能超过 15 MB。');
        const url = URL.createObjectURL(file);
        try {
            const image = new Image();
            await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('照片无法读取，请尝试 JPG 格式。')); image.src = url; });
            const ratio = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
            const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
            const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', 0.78);
        } finally { URL.revokeObjectURL(url); }
    }
    A.addPhotos = async input => {
        if (draftPhotos.length + input.files.length > 6) throw new Error('每条巡店最多保存 6 张照片。');
        A.photoBusy = true;
        const dialog = document.getElementById('editor');
        const submit = dialog.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
        const files = Array.from(input.files);
        try {
            const result = [];
            for (const file of files) result.push(await compress(file));
            if (dialog.contains(input)) { draftPhotos.push(...result); renderPhotos(); U.toast('照片已处理，保存记录后生效'); }
        } finally { input.value = ''; A.photoBusy = false; if (submit) submit.disabled = false; }
    };
    A.pages.issues = () => {
        const rows = A.state.issues.filter(i => (!A.filters.search || (C.storeName(i.storeId) + i.description + i.owner).includes(A.filters.search)) && (!A.filters.status || (A.filters.status === '逾期' ? C.overdue(i) : i.status === A.filters.status))).slice().sort((a, b) => Number(C.isOpen(b)) - Number(C.isOpen(a)) || (a.deadline || '9999').localeCompare(b.deadline || '9999'));
        return U.header('整改 / FOLLOW UP', '整改跟踪', '从发现问题到复查完成，保留处理记录', U.button('新增问题', 'issue-new', '', 'primary', 'plus')) + U.search('搜索门店、问题或负责人', `<select data-filter="status" aria-label="整改状态">${U.options([{ id: '', name: '全部状态' }].concat(['待整改', '整改中', '待复查', '已完成', '逾期']), A.filters.status)}</select>${U.button('导出 CSV', 'issue-export', '', 'secondary', 'download')}`) + `<p class="list-count">共 ${rows.length} 项 · ${A.state.issues.filter(C.overdue).length} 项逾期</p><section class="panel records">${rows.map(i => `<button class="record-row" data-action="issue-view" data-id="${U.esc(i.id)}"><span class="record-icon ${C.overdue(i) ? 'red' : ''}">${U.icon('issues')}</span><span class="record-body"><strong>${U.esc(i.description)}</strong><small>${U.esc(C.storeName(i.storeId))} · ${U.esc(i.owner || '未指定负责人')} · ${U.esc(i.level)}</small><p>期限 ${U.esc(i.deadline || '未设置')}${C.overdue(i) ? ' · 已逾期' : ''}</p></span>${U.badge(i.status)}${U.icon('arrow', 17)}</button>`).join('') || U.empty('没有符合条件的整改问题', '新增问题', 'issue-new', 'check')}</section>`;
    };
    function issueEditor(id, inspectionId) {
        if (!A.state.stores.length) throw new Error('请先添加门店。');
        const inspection = A.state.inspections.find(i => i.id === inspectionId);
        const row = A.state.issues.find(i => i.id === id) || { storeId: inspection ? inspection.storeId : A.state.stores[0].id, inspectionId: inspectionId || '', description: '', category: '其他', level: '一般', status: '待整改' };
        U.modal(id ? '更新整改任务' : '新增整改问题', `<input type="hidden" name="inspectionId" value="${U.esc(row.inspectionId)}"><div class="form-grid">${U.storeSelect('storeId', row.storeId)}${U.select('问题类别', 'category', ['环境卫生', '食品安全', '出品标准', '服务规范', '人员管理', '物料管理', '设施安全', '其他'], row.category)}${U.select('等级', 'level', ['一般', '重要', '紧急'], row.level)}${U.select('整改状态', 'status', ['待整改', '整改中', '待复查', '已完成'], row.status)}${U.field('负责人', 'owner', row.owner)}${U.field('整改期限', 'deadline', row.deadline, 'date')}</div>${U.area('问题描述 *', 'description', row.description, 'required maxlength="3000"')}${U.area('解决方案 / 整改结果', 'solution', row.solution, 'maxlength="5000"')}<p class="note">选择“已完成”时，请填写整改结果或复查结论。</p>`, 'issue', id);
        if (row.inspectionId) document.getElementById('editor').querySelector('[name="storeId"]').setAttribute('disabled', '');
    }
    A.actions['issue-new'] = () => issueEditor('');
    A.actions['issue-edit'] = id => issueEditor(id);
    A.actions['issue-for-inspection'] = id => issueEditor('', id);
    A.actions['issue-view'] = id => {
        const i = A.state.issues.find(row => row.id === id); if (!i) return;
        U.modal('整改任务', `<p>${U.badge(i.status)} ${U.badge(i.level, i.level === '紧急' ? 'red' : 'neutral')} ${C.overdue(i) ? U.badge('已逾期', 'red') : ''}</p>${U.details([['门店', C.storeName(i.storeId)], ['问题描述', i.description], ['问题类别', i.category], ['负责人', i.owner], ['整改期限', i.deadline], ['解决方案 / 整改结果', i.solution], ['完成日期', i.completedDate]])}<div class="detail-actions">${U.button('更新整改', 'issue-edit', id)}${i.inspectionId ? U.button('查看关联巡店', 'inspection-view', i.inspectionId, 'secondary') : ''}${U.button('删除问题', 'issue-delete', id, 'danger')}</div>`);
    };
    A.forms.issue = async (form, id) => {
        const v = Object.fromEntries(new FormData(form));
        if (v.status === '已完成' && !v.solution.trim()) throw new Error('请填写整改结果或复查结论。');
        await A.storage.transact(state => {
            const old = state.issues.find(i => i.id === id);
            const inspection = state.inspections.find(i => i.id === v.inspectionId);
            const row = { id: id || C.uid('issue'), storeId: inspection ? inspection.storeId : v.storeId, inspectionId: v.inspectionId, description: v.description.trim(), category: v.category, level: v.level, status: v.status, owner: v.owner.trim(), deadline: v.deadline, solution: v.solution.trim(), createdAt: old ? old.createdAt : new Date().toISOString(), completedDate: v.status === '已完成' ? ((old || {}).completedDate || C.localDate()) : '' };
            const index = state.issues.findIndex(i => i.id === id); if (index < 0) state.issues.push(row); else state.issues[index] = row;
        }); A.saved('整改任务已保存');
    };
    A.actions['issue-delete'] = async id => {
        if (!confirm('确定删除这条整改任务？')) return;
        await A.storage.transact(state => { state.issues = state.issues.filter(i => i.id !== id); }); A.saved('整改任务已删除');
    };
    A.actions['issue-export'] = () => U.download('整改任务_' + C.localDate() + '.csv', C.csv([['门店', '问题', '类别', '等级', '负责人', '期限', '状态', '解决方案', '完成日期']].concat(A.state.issues.map(i => [C.storeName(i.storeId), i.description, i.category, i.level, i.owner, i.deadline, i.status, i.solution, i.completedDate]))), 'text/csv;charset=utf-8');
})();
