(function () {
    'use strict';
    const A = window.Inspect, U = A.ui;
    const nav = [
        ['home', '工作台'], ['stores', '门店管理'], ['inspections', '巡店记录'], ['issues', '整改跟踪'], ['personnel', '人员调配'], ['support', '新店帮扶'], ['weekly', '督导周报'], ['settings', '我的与数据']
    ];
    A.filters = {};
    A.route = 'home';
    function route() {
        const requested = location.hash.slice(1).split('?')[0];
        return A.pages[requested] ? requested : 'home';
    }
    A.render = function (retainFocus = false) {
        const focus = retainFocus && document.activeElement && document.activeElement.id === 'page-search';
        const cursor = focus ? document.activeElement.selectionStart : null;
        const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
        document.getElementById('app').innerHTML = `<div class="app-shell"><aside class="sidebar"><a class="brand" href="#home"><span class="brand-mark">江</span><span><strong>江欢欢</strong><small>巡店管理系统</small></span></a><div class="sidebar-label">运营工作空间</div><nav aria-label="主导航">${nav.map(([key, label]) => `<a href="#${key}" class="${A.route === key ? 'active' : ''}" ${A.route === key ? 'aria-current="page"' : ''}>${U.icon(key)}<span>${label}</span>${key === 'issues' && A.state.issues.filter(A.core.isOpen).length ? `<small class="nav-count">${A.state.issues.filter(A.core.isOpen).length}</small>` : ''}</a>`).join('')}</nav><div class="sidebar-bottom"><span class="local-dot"></span><strong>本设备保存</strong><small>v${A.version} · 离线可用</small><a href="#settings">备份与导入 ${U.icon('arrow', 14)}</a></div></aside><div class="workspace"><header class="topbar"><a class="mobile-brand" href="#home"><span class="brand-mark">江</span><strong>江欢欢巡店</strong></a><span class="top-date">${today}</span><div class="top-right"><span class="connection ${navigator.onLine ? '' : 'offline'}">${navigator.onLine ? '本地保存' : '离线模式'}</span><a class="top-profile" href="#settings"><span>${U.esc(A.state.settings.name.slice(0, 1))}</span>${U.esc(A.state.settings.name)}</a></div></header>${A.waitingWorker ? `<div class="update-banner">新版本已就绪 ${U.button('更新页面', 'apply-update', '', 'secondary')}</div>` : ''}${A.storage.mode() === 'localStorage' ? '<div class="storage-banner">当前浏览器使用备用存储，照片较多时请及时导出备份。</div>' : ''}<main id="main" tabindex="-1">${A.pages[A.route]()}</main><footer class="app-footer">江欢欢巡店管理 · 数据保存在本设备</footer></div><nav class="bottom-nav" aria-label="手机导航">${[['home', '首页'], ['stores', '门店'], ['inspections', '巡店'], ['personnel', '人员'], ['settings', '我的']].map(([key, label]) => `<a href="#${key}" class="${A.route === key ? 'active' : ''}">${U.icon(key, 21)}<span>${label}</span></a>`).join('')}</nav></div>`;
        document.getElementById('app').setAttribute('aria-busy', 'false');
        if (focus) { const input = document.getElementById('page-search'); if (input) { input.focus(); if (cursor !== null) input.setSelectionRange(cursor, cursor); } }
    };
    A.saved = message => { A.dirty = false; U.close(); A.render(); U.toast(message); };
    A.actions.close = () => {
        if (A.photoBusy) throw new Error('照片处理中，请稍后关闭。');
        if (A.dirty && !confirm('有未保存的修改，确定关闭？')) return;
        A.dirty = false; U.close();
    };
    for (const [key] of nav) A.actions['go-' + key] = () => { U.close(); location.hash = key; };
    A.actions['photo-view'] = (_, button) => {
        const src = button.querySelector('img').src;
        U.modal('现场照片', `<img class="full-photo" src="${U.esc(src)}" alt="现场照片放大查看">`);
    };
    A.actions['apply-update'] = () => {
        if (A.waitingWorker) A.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    };
    document.addEventListener('click', async event => {
        const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
        const action = A.actions[button.dataset.action]; if (!action) return;
        try { await action(button.dataset.id || '', button); }
        catch (error) { U.toast(error.message || '操作未完成，请重试。', true); }
    });
    document.addEventListener('submit', async event => {
        const form = event.target.closest('form[data-form]'); if (!form) return;
        event.preventDefault(); if (!form.reportValidity()) return;
        const button = form.querySelector('[type="submit"]');
        if (button.disabled) return;
        button.disabled = true;
        try { await A.forms[form.dataset.form](form, form.dataset.id || ''); }
        catch (error) { U.toast(error.message || '保存失败，请重试。', true); }
        finally { if (button.isConnected) button.disabled = false; }
    });
    document.addEventListener('input', event => {
        if (event.target.closest('#editor form')) A.dirty = true;
        if (event.target.id === 'page-search') { A.filters.search = event.target.value; A.render(true); }
    });
    document.addEventListener('change', async event => {
        const target = event.target;
        try {
            if (target.closest('#editor form')) A.dirty = true;
            if (target.dataset.filter) { A.filters[target.dataset.filter] = target.value; A.render(); }
            if (target.id === 'photo-input') await A.addPhotos(target);
            if (target.id === 'backup-input') await A.importBackup(target);
        } catch (error) { U.toast(error.message, true); }
    });
    document.getElementById('editor').addEventListener('cancel', event => {
        if (A.photoBusy) { event.preventDefault(); U.toast('照片处理中，请稍后关闭'); return; }
        if (A.dirty && !confirm('有未保存的修改，确定关闭？')) event.preventDefault(); else A.dirty = false;
    });
    const originalModal = U.modal;
    U.modal = function (...args) { A.dirty = false; originalModal(...args); };
    window.addEventListener('beforeunload', event => { if (A.dirty) { event.preventDefault(); event.returnValue = ''; } });
    window.addEventListener('hashchange', () => { A.route = route(); A.filters = {}; A.render(); window.scrollTo(0, 0); });
    window.addEventListener('online', () => A.state && A.render());
    window.addEventListener('offline', () => A.state && A.render());
    window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); A.installPrompt = event; if (A.state && A.route === 'settings') A.render(); });
    window.addEventListener('appinstalled', () => { A.installPrompt = null; U.toast('应用已安装'); });
    async function start() {
        try {
            await A.storage.init(); A.route = route(); A.render();
            if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) {
                const registration = await navigator.serviceWorker.register('./service-worker.js');
                if (registration.waiting) { A.waitingWorker = registration.waiting; A.render(); }
                registration.addEventListener('updatefound', () => {
                    const worker = registration.installing;
                    if (worker) worker.addEventListener('statechange', () => {
                        if (worker.state === 'installed' && navigator.serviceWorker.controller) { A.waitingWorker = registration.waiting; A.render(); }
                    });
                });
                navigator.serviceWorker.addEventListener('controllerchange', () => { if (A.waitingWorker) location.reload(); });
            }
        } catch (error) {
            if (A.state) { U.toast('离线组件暂未就绪，联网功能可继续使用。', true); return; }
            document.getElementById('app').innerHTML = `<div class="startup"><div class="brand-mark">江</div><h1>无法读取本设备数据</h1><p>${U.esc(error.message || '浏览器存储不可用')}</p><p>请退出无痕模式，允许网站存储，然后刷新。已使用过的设备请先保留原始数据，避免清除浏览器记录。</p><button class="btn primary" type="button" id="retry-start">重新加载</button></div>`;
            document.getElementById('retry-start').onclick = () => location.reload();
        }
    }
    start();
})();
