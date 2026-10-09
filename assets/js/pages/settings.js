(function () {
    'use strict';
    const A = window.Inspect, U = A.ui, C = A.core;
    A.pages.settings = () => U.header('我的 / SETTINGS', '我的与数据', '维护督导资料，备份工作记录，安装手机应用') + `<div class="dashboard-grid"><section class="panel"><div class="profile"><div class="profile-avatar">${U.esc(A.state.settings.name.slice(0, 1))}</div><div><h2>${U.esc(A.state.settings.name)}</h2><p>${U.esc(A.state.settings.department)}</p><small>${U.esc(A.state.settings.company)}</small></div></div>${U.button('编辑督导资料', 'profile-edit', '', 'secondary')}<h3 class="form-section">本设备数据</h3><div class="settings-stats"><span>门店 <strong>${A.state.stores.length}</strong></span><span>巡店 <strong>${A.state.inspections.length}</strong></span><span>整改 <strong>${A.state.issues.length}</strong></span><span>人员 <strong>${A.state.personnel.length}</strong></span><span>帮扶 <strong>${A.state.supports.length}</strong></span><span>周报 <strong>${A.state.reports.length}</strong></span></div><p class="muted">最近保存：${U.esc(new Date(A.state.updatedAt).toLocaleString('zh-CN'))}</p></section><section class="panel"><div class="section-heading"><h2>数据备份</h2>${U.icon('download')}</div><p class="muted">JSON 备份包含全部资料、照片和记录，可在另一台设备导入。</p><div class="stack-actions">${U.button('导出完整备份（含照片）', 'backup-export', '', 'primary', 'download')}<label class="btn secondary import-label">导入 JSON 备份<input id="backup-input" type="file" accept="application/json,.json"></label>${U.button('申请持久保存', 'storage-persist', '', 'secondary')}</div><p class="note">本版是单设备离线应用。手机与电脑的数据各自保存，不会自动同步。清除浏览器数据会删除记录，请定期备份。</p></section></div><div class="dashboard-grid"><section class="panel"><div class="section-heading"><h2>安装到手机</h2><span class="version">v${A.version}</span></div><ol class="install-steps"><li>用手机浏览器打开部署后的 HTTPS 网址。</li><li>安卓：在浏览器菜单选择“安装应用”或“添加到主屏幕”。</li><li>iPhone：在 Safari 分享菜单选择“添加到主屏幕”。</li><li>安装后从桌面图标打开，可用独立窗口操作。</li></ol>${A.installPrompt ? U.button('安装应用', 'install-app', '', 'primary') : ''}<p class="muted">首次联网打开后，核心页面可离线使用。直接双击电脑上的 HTML 可检查功能，手机安装请使用部署网址。</p>${U.button('检查页面更新', 'check-update', '', 'secondary')}</section><section class="panel"><h2>使用说明</h2><ol class="install-steps"><li>门店：补充负责人、地址和岗位编制。</li><li>巡店：逐项检查、附照片，填写发现的问题。</li><li>整改：指定负责人和期限，更新状态，复查完成。</li><li>人员：保存档案、分配门店，查看缺口。</li><li>新店：跟进装修、培训及开业准备。</li><li>周报：汇总日期范围，补充报货分析与工作计划。</li></ol><a class="text-link" href="./README.md" target="_blank" rel="noopener">查看源码与部署说明 ${U.icon('arrow', 15)}</a></section></div><section class="panel danger-panel"><h2>重置本设备数据</h2><p class="muted">删除全部工作记录与照片，恢复初始 22 家门店。请先导出备份。</p>${U.button('重置数据', 'reset-open', '', 'danger')}</section>`;
    A.actions['profile-edit'] = () => U.modal('督导资料', `<div class="form-grid">${U.field('督导姓名 *', 'name', A.state.settings.name, 'text', 'required maxlength="60"')}${U.field('部门', 'department', A.state.settings.department)}${U.field('公司', 'company', A.state.settings.company)}</div>`, 'profile');
    A.forms.profile = async form => {
        const v = Object.fromEntries(new FormData(form));
        await A.storage.transact(state => { state.settings = { name: v.name.trim(), department: v.department.trim(), company: v.company.trim() }; }); A.saved('督导资料已保存');
    };
    A.actions['backup-export'] = () => {
        const backup = { format: 'jianghuanhuan-inspection', appVersion: A.version, exportedAt: new Date().toISOString(), data: A.state };
        U.download('江欢欢巡店_完整备份_' + C.localDate() + '.json', JSON.stringify(backup, null, 2), 'application/json;charset=utf-8'); U.toast('完整备份已导出');
    };
    A.importBackup = async input => {
        const file = input.files[0]; if (!file) return;
        try {
            if (file.size > 100 * 1024 * 1024) throw new Error('备份超过 100 MB，请减少照片或在电脑上处理。');
            let backup;
            try { backup = JSON.parse(await file.text()); } catch (_) { throw new Error('文件不是有效的 JSON 备份。'); }
            if (backup.format !== 'jianghuanhuan-inspection') throw new Error('请选择本系统导出的完整备份文件。');
            const state = C.validate(backup.data);
            if (!confirm(`备份包含 ${state.stores.length} 家门店、${state.inspections.length} 条巡店、${state.personnel.length} 个人员档案。导入会覆盖本设备当前数据，确定继续？`)) return;
            await A.storage.transact(next => { for (const key of Object.keys(next)) delete next[key]; Object.assign(next, C.clone(state)); });
            A.render(); U.toast('完整备份已导入');
        } finally { input.value = ''; }
    };
    A.actions['storage-persist'] = async () => {
        if (!navigator.storage || !navigator.storage.persist) throw new Error('当前浏览器不支持持久保存申请，请使用完整备份。');
        const granted = await navigator.storage.persist();
        U.toast(granted ? '浏览器已允许持久保存，请继续定期备份' : '浏览器未授予持久保存，请定期导出备份');
    };
    A.actions['reset-open'] = () => U.modal('重置数据', `<p class="danger-text">此操作会清除本设备全部记录和照片。请先完成备份。</p>${U.field('输入“重置”确认 *', 'confirmation', '', 'text', 'required')}`, 'reset');
    A.forms.reset = async form => {
        if (form.elements.confirmation.value !== '重置') throw new Error('请输入“重置”再提交。');
        await A.storage.transact(state => { const empty = C.emptyState(); for (const key of Object.keys(state)) delete state[key]; Object.assign(state, empty); }); A.saved('本设备数据已重置');
    };
    A.actions['install-app'] = async () => {
        if (!A.installPrompt) return;
        await A.installPrompt.prompt(); await A.installPrompt.userChoice;
        A.installPrompt = null; A.render();
    };
    A.actions['check-update'] = async () => {
        if (!('serviceWorker' in navigator) || location.protocol === 'file:') throw new Error('请在部署后的 HTTPS 网址检查更新。');
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) throw new Error('离线组件还未就绪，请刷新页面后重试。');
        await registration.update();
        if (registration.waiting) { A.waitingWorker = registration.waiting; A.render(); U.toast('新版本已就绪，点击顶部“更新页面”'); }
        else U.toast('已检查更新；新版本下载完成后会显示更新提示');
    };
})();
