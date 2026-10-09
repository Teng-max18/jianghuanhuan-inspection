(function () {
    'use strict';
    const A = window.Inspect;
    const U = A.ui, C = A.core;
    A.pages.home = function () {
        const week = C.weekRange();
        const visits = A.state.inspections.filter(i => i.date >= week.start && i.date <= week.end);
        const unique = new Set(visits.map(i => i.storeId)).size;
        const activeStores = A.state.stores.filter(s => s.status === '营业中');
        const covered = activeStores.filter(s => visits.some(i => i.storeId === s.id)).length;
        const pending = A.state.issues.filter(C.isOpen);
        const late = pending.filter(C.overdue);
        const scores = visits.map(C.score).filter(s => s !== null);
        const average = scores.length ? Math.round(scores.reduce((sum, n) => sum + n, 0) / scores.length) : null;
        const shortcuts = [
            ['inspections', '记录巡店', '检查、照片与问题', 'inspection-new'],
            ['issues', '跟进整改', `${pending.length} 项待跟进`, 'go-issues'],
            ['personnel', '人员调配', '岗位与门店缺口', 'go-personnel'],
            ['support', '新店帮扶', '装修、培训与开业', 'go-support'],
            ['weekly', '生成周报', '汇总本周工作', 'weekly-new']
        ];
        return U.header('工作台 / OVERVIEW', '今天，门店情况一目了然', `${C.localDate()} · ${A.state.settings.name} · ${A.state.settings.department}`, U.button('开始巡店', 'inspection-new', '', 'primary', 'plus')) + `
            <section class="hero"><div><span class="hero-tag">江欢欢 · 运营管理</span><h2>做好每一次巡店<br>跟进每一个问题</h2><p>本周 ${week.start.slice(5)} — ${week.end.slice(5)}，已巡 ${unique} 家门店，记录 ${visits.length} 次巡店。</p><a class="hero-link" href="#inspections">查看巡店记录 ${U.icon('arrow', 16)}</a></div><div class="hero-art" aria-hidden="true"><div class="art-roof"></div><div class="art-store"><span>江欢欢</span><div class="art-door"></div></div><div class="art-sign">江西小炒</div></div></section>
            <section class="metrics">
                <a class="metric" href="#stores"><span class="metric-icon">${U.icon('stores')}</span><span>门店总数</span><strong>${A.state.stores.length}<small>家</small></strong><p>${activeStores.length} 家营业中</p></a>
                <a class="metric" href="#inspections"><span class="metric-icon">${U.icon('inspections')}</span><span>本周巡店</span><strong>${visits.length}<small>次</small></strong><p>覆盖 ${unique} 家门店</p></a>
                <a class="metric" href="#issues"><span class="metric-icon red">${U.icon('issues')}</span><span>待完成整改</span><strong>${pending.length}<small>项</small></strong><p class="${late.length ? 'danger-text' : ''}">${late.length} 项已逾期</p></a>
                <a class="metric" href="#personnel"><span class="metric-icon">${U.icon('personnel')}</span><span>人员缺口</span><strong>${C.totalGap('厨师') + C.totalGap('服务员')}<small>人</small></strong><p>厨师 ${C.totalGap('厨师')} · 服务员 ${C.totalGap('服务员')}</p></a>
            </section>
            <section class="panel"><div class="section-heading"><h2>常用工作</h2><span class="muted">从这里开始</span></div><div class="shortcut-grid">${shortcuts.map(([i, title, desc, action]) => `<button class="shortcut" data-action="${action}"><span class="shortcut-icon">${U.icon(i, 24)}</span><strong>${title}</strong><small>${desc}</small></button>`).join('')}</div></section>
            <div class="dashboard-grid"><section class="panel"><div class="section-heading"><h2>整改待办</h2><a href="#issues">查看全部 ${U.icon('arrow', 15)}</a></div>${pending.length ? pending.slice().sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999')).slice(0, 4).map(issue => `<button class="todo-row" data-action="issue-view" data-id="${U.esc(issue.id)}"><span class="todo-dot ${C.overdue(issue) ? 'late' : ''}"></span><span><strong>${U.esc(issue.description)}</strong><small>${U.esc(C.storeName(issue.storeId))} · ${U.esc(issue.owner || '未指定负责人')}</small></span><span class="todo-meta">${U.badge(C.overdue(issue) ? '已逾期' : issue.status, C.overdue(issue) ? 'red' : '')}<small>${U.esc(issue.deadline || '未设期限')}</small></span></button>`).join('') : U.empty('还没有待整改问题', '记录一次巡店', 'inspection-new', 'check')}</section>
            <section class="panel"><div class="section-heading"><h2>本周巡店概览</h2><a href="#weekly">督导周报 ${U.icon('arrow', 15)}</a></div><div class="coverage"><div class="coverage-value">${activeStores.length ? Math.round(covered / activeStores.length * 100) : 0}<small>%</small></div><p>营业门店巡检覆盖率</p><div class="progress"><span style="width:${activeStores.length ? Math.min(100, covered / activeStores.length * 100) : 0}%"></span></div><div class="coverage-bottom"><span>已巡 ${covered} / ${activeStores.length} 家</span><span>平均检查分 ${average === null ? '—' : average}</span></div></div><div class="note">人员缺口按门店编制和在职人员计算。请先在门店资料中设置编制人数。</div></section></div>
            <section class="panel"><div class="section-heading"><h2>最近巡店</h2><a href="#inspections">全部记录 ${U.icon('arrow', 15)}</a></div>${A.state.inspections.length ? A.state.inspections.slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 4).map(i => `<button class="record-row" data-action="inspection-view" data-id="${U.esc(i.id)}"><span class="record-icon">${U.icon('inspections')}</span><span><strong>${U.esc(C.storeName(i.storeId))}</strong><small>${U.esc(i.date)} · ${U.esc(i.inspector)}</small></span><span class="record-score">${C.score(i) === null ? '未评分' : C.score(i) + ' 分'}</span>${U.icon('arrow', 17)}</button>`).join('') : `<div class="inline-empty">暂无巡店记录。点击“开始巡店”保存第一条记录。</div>`}</section>`;
    };
})();
