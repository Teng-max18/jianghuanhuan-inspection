(function () {
    'use strict';
    const A = window.Inspect, U = A.ui, C = A.core;
    function generate(start, end) {
        const inspections = A.state.inspections.filter(i => i.date >= start && i.date <= end).slice().sort((a, b) => a.date.localeCompare(b.date));
        const issues = A.state.issues.filter(i => {
            const createdDate = C.localDate(new Date(i.createdAt));
            return inspections.some(v => v.id === i.inspectionId) || (createdDate >= start && createdDate <= end) || (i.completedDate && i.completedDate >= start && i.completedDate <= end);
        });
        const supports = A.state.supports.filter(s => (s.updatedDate >= start && s.updatedDate <= end) || (s.startDate >= start && s.startDate <= end) || (s.openingDate >= start && s.openingDate <= end));
        const month = start.slice(0, 7);
        return {
            summary: inspections.map((i, n) => `${n + 1}. ${i.date} ${C.storeName(i.storeId)}：${i.summary || '完成门店巡检'}（检查分 ${C.score(i) === null ? '未评分' : C.score(i)}）`).join('\n') || '本周期暂无巡店记录，请填写实际工作内容。',
            problems: issues.map((i, n) => `${n + 1}. ${C.storeName(i.storeId)}：${i.description}（${i.status}）`).join('\n'),
            solutions: issues.filter(i => i.solution).map((i, n) => `${n + 1}. ${C.storeName(i.storeId)}：${i.solution}`).join('\n'),
            newStoreProgress: supports.map(s => `${C.storeName(s.storeId)}：${A.data.stages.filter((_, n) => s.stages['stage-' + n] === '已完成').length}/${A.data.stages.length} 项完成；${s.notes || ''}；培训：${s.training || '待填写'}`).join('\n'),
            openingPlan: A.state.stores.filter(s => s.openingDate && s.openingDate.startsWith(month)).map(s => `${s.openingDate} ${s.name}（${s.status}）`).join('\n')
        };
    }
    A.pages.weekly = () => {
        const rows = A.state.reports.filter(r => !A.filters.search || (r.name + r.supervisor + r.summary + r.start + r.end).includes(A.filters.search)).slice().sort((a, b) => b.start.localeCompare(a.start));
        return U.header('汇报 / WEEKLY REPORT', '督导周报', '按工作总结、装修跟进、开业计划和报货分析汇报', U.button('生成周报', 'weekly-new', '', 'primary', 'plus')) + `<div class="note intro-note">先记录巡店和帮扶，再选择日期生成摘要。报货量与分析由你填写，保存后可导出 CSV、复制文本或打印为 PDF。</div>` + U.search('搜索周报标题、日期或内容') + `<section class="panel records">${rows.map(r => `<button class="record-row" data-action="weekly-view" data-id="${U.esc(r.id)}"><span class="record-icon">${U.icon('weekly')}</span><span class="record-body"><strong>${U.esc(r.name)}</strong><small>${U.esc(r.start)} 至 ${U.esc(r.end)} · ${U.esc(r.supervisor)}</small><p>${U.esc(r.summary)}</p></span>${U.badge('已保存', 'green')}${U.icon('arrow', 17)}</button>`).join('') || U.empty('还没有督导周报', '生成第一份周报', 'weekly-new', 'weekly')}</section>`;
    };
    function editor(id) {
        const range = C.weekRange();
        const row = A.state.reports.find(r => r.id === id) || { name: '督导周报', start: range.start, end: range.end, supervisor: A.state.settings.name, department: A.state.settings.department, company: A.state.settings.company, ...generate(range.start, range.end), ordersUnit: '元', dayPlans: {} };
        U.modal(id ? '编辑督导周报' : '生成督导周报', `<div class="form-grid">${U.field('周报标题 *', 'name', row.name, 'text', 'required')}${U.field('督导姓名 *', 'supervisor', row.supervisor, 'text', 'required')}${U.field('开始日期 *', 'start', row.start, 'date', 'required')}${U.field('结束日期 *', 'end', row.end, 'date', 'required')}${U.field('部门', 'department', row.department)}${U.field('公司', 'company', row.company)}</div><div class="form-refresh">${U.button('按当前日期重新汇总', 'weekly-refresh', '', 'secondary')}<span class="muted">会覆盖下方自动汇总的五项文本。</span></div>${U.area('一、工作总结（巡店）', 'summary', row.summary)}${U.area('二、发现 / 协助解决的问题', 'problems', row.problems)}${U.area('解决方案', 'solutions', row.solutions)}${U.area('三、装修进度 / 新店帮扶', 'newStoreProgress', row.newStoreProgress)}${U.area('四、本月开业门店 / 开业计划', 'openingPlan', row.openingPlan)}<h3 class="form-section">五、报货分析</h3><div class="form-grid">${U.select('报货统计单位', 'ordersUnit', ['元', '件', '箱', '公斤'], row.ordersUnit || '元')}${U.field('总体报货量', 'ordersTotal', row.ordersTotal, 'number', 'min="0" step="0.01"')}${U.field('酱料报货量', 'ordersSauce', row.ordersSauce, 'number', 'min="0" step="0.01"')}</div><p class="muted">请选择本次统计使用的单位；没有数据时留空，不自动填零。</p>${U.area('酱料未报门店', 'noSauceStores', row.noSauceStores)}${U.area('报货量前五名（门店 + 报货量）', 'topOrders', row.topOrders)}${U.area('总结分析', 'analysis', row.analysis)}<h3 class="form-section">六、每周工作计划</h3>${A.data.days.map((day, i) => U.field(day, 'day-' + i, row.dayPlans['day-' + i] || '')).join('')}${U.area('其他工作计划', 'nextPlan', row.nextPlan)}`, 'weekly', id);
    }
    A.actions['weekly-new'] = () => editor('');
    A.actions['weekly-edit'] = id => editor(id);
    A.actions['weekly-refresh'] = () => {
        const form = document.querySelector('#editor form');
        const start = form.elements.start.value, end = form.elements.end.value;
        if (!start || !end || start > end) throw new Error('请先选择有效的周报日期范围。');
        if (!confirm('重新汇总会覆盖工作总结、问题、解决方案、装修帮扶和开业计划，继续？')) return;
        for (const [key, value] of Object.entries(generate(start, end))) form.elements[key].value = value;
        U.toast('已按日期汇总，请补充报货分析与工作计划');
    };
    A.forms.weekly = async (form, id) => {
        const v = Object.fromEntries(new FormData(form));
        if (v.start > v.end) throw new Error('结束日期不能早于开始日期。');
        await A.storage.transact(state => {
            const row = { id: id || C.uid('weekly'), name: v.name.trim(), supervisor: v.supervisor.trim(), start: v.start, end: v.end, department: v.department.trim(), company: v.company.trim(), summary: v.summary.trim(), problems: v.problems.trim(), solutions: v.solutions.trim(), newStoreProgress: v.newStoreProgress.trim(), openingPlan: v.openingPlan.trim(), ordersUnit: v.ordersUnit, ordersTotal: v.ordersTotal === '' ? null : Number(v.ordersTotal), ordersSauce: v.ordersSauce === '' ? null : Number(v.ordersSauce), noSauceStores: v.noSauceStores.trim(), topOrders: v.topOrders.trim(), analysis: v.analysis.trim(), nextPlan: v.nextPlan.trim(), dayPlans: Object.fromEntries(A.data.days.map((_, i) => ['day-' + i, v['day-' + i].trim()])), updatedAt: new Date().toISOString() };
            const index = state.reports.findIndex(r => r.id === id); if (index < 0) state.reports.push(row); else state.reports[index] = row;
        }); A.saved('督导周报已保存');
    };
    const amount = (n, unit) => n === null || n === undefined ? '未填写' : Number(n).toFixed(2) + ' ' + U.esc(unit || '元');
    function body(r) {
        return `<article class="report"><h2>${U.esc(r.company)}</h2><h1>${U.esc(r.name)}</h1><p class="report-meta">部门：${U.esc(r.department)}　姓名：${U.esc(r.supervisor)}<br>${U.esc(r.start)} 至 ${U.esc(r.end)}</p>${[['一、工作总结', r.summary], ['二、发现 / 协助解决的问题', r.problems], ['解决方案', r.solutions], ['三、装修进度 / 新店帮扶', r.newStoreProgress], ['四、本月开业门店 / 开业计划', r.openingPlan]].map(([label, value]) => `<h3>${label}</h3><p>${U.text(value || '暂无')}</p>`).join('')}<h3>五、报货分析</h3><p>总体报货量：${amount(r.ordersTotal, r.ordersUnit)}<br>酱料报货量：${amount(r.ordersSauce, r.ordersUnit)}</p>${[['酱料未报门店', r.noSauceStores], ['报货量前五名', r.topOrders], ['总结分析', r.analysis]].map(([label, value]) => `<h4>${label}</h4><p>${U.text(value || '暂无')}</p>`).join('')}<h3>六、每周工作计划</h3><table><tbody>${A.data.days.map((day, i) => `<tr><th>${day}</th><td>${U.text(r.dayPlans['day-' + i] || '—')}</td></tr>`).join('')}</tbody></table><p>${U.text(r.nextPlan)}</p></article>`;
    }
    function plain(r) {
        return `${r.company}\n${r.name}\n部门：${r.department}  姓名：${r.supervisor}\n${r.start} 至 ${r.end}\n\n一、工作总结\n${r.summary}\n\n二、发现 / 协助解决的问题\n${r.problems}\n解决方案\n${r.solutions}\n\n三、装修进度 / 新店帮扶\n${r.newStoreProgress}\n\n四、本月开业门店 / 开业计划\n${r.openingPlan}\n\n五、报货分析\n总体报货量：${amount(r.ordersTotal, r.ordersUnit)}\n酱料报货量：${amount(r.ordersSauce, r.ordersUnit)}\n酱料未报门店：${r.noSauceStores}\n报货量前五名：${r.topOrders}\n总结分析：${r.analysis}\n\n六、每周工作计划\n${A.data.days.map((day, i) => day + '：' + (r.dayPlans['day-' + i] || '')).join('\n')}\n${r.nextPlan}`;
    }
    A.actions['weekly-view'] = id => {
        const r = A.state.reports.find(row => row.id === id); if (!r) return;
        U.modal('周报预览', `<div class="detail-actions report-buttons">${U.button('编辑', 'weekly-edit', id)}${U.button('导出 CSV', 'weekly-export', id, 'secondary', 'download')}${U.button('复制文本', 'weekly-copy', id, 'secondary')}${U.button('打印 / PDF', 'weekly-print', id, 'secondary')}${U.button('删除', 'weekly-delete', id, 'danger')}</div>${body(r)}`);
    };
    A.actions['weekly-print'] = id => {
        const r = A.state.reports.find(row => row.id === id);
        document.getElementById('print-area').innerHTML = body(r);
        window.print();
    };
    A.actions['weekly-copy'] = async id => {
        const r = A.state.reports.find(row => row.id === id);
        try { await navigator.clipboard.writeText(plain(r)); U.toast('周报文本已复制'); }
        catch (_) { U.download('督导周报_' + r.start + '.txt', plain(r), 'text/plain;charset=utf-8'); U.toast('已下载周报文本'); }
    };
    A.actions['weekly-export'] = id => {
        const r = A.state.reports.find(row => row.id === id);
        const rows = [['栏目', '内容'], ['公司', r.company], ['标题', r.name], ['部门', r.department], ['督导姓名', r.supervisor], ['开始日期', r.start], ['结束日期', r.end], ['工作总结', r.summary], ['问题', r.problems], ['解决方案', r.solutions], ['装修进度 / 新店帮扶', r.newStoreProgress], ['本月开业门店 / 开业计划', r.openingPlan], ['统计单位', r.ordersUnit || '元'], ['总体报货量', r.ordersTotal], ['酱料报货量', r.ordersSauce], ['酱料未报门店', r.noSauceStores], ['报货量前五名', r.topOrders], ['总结分析', r.analysis], ...A.data.days.map((day, i) => [day, r.dayPlans['day-' + i]]), ['其他工作计划', r.nextPlan]];
        U.download('督导周报_' + r.start + '.csv', C.csv(rows), 'text/csv;charset=utf-8');
    };
    A.actions['weekly-delete'] = async id => {
        if (!confirm('确定删除这份周报？')) return;
        await A.storage.transact(state => { state.reports = state.reports.filter(r => r.id !== id); }); A.saved('周报已删除');
    };
})();
