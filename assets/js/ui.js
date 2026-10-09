(function () {
    'use strict';
    const A = window.Inspect;
    const paths = {
        home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
        stores: '<path d="M3 10h18l-2-6H5zM4 10v10h16V10M8 20v-6h5v6M3 10c0 4 4 4 4 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 4 4 4 0"/>',
        inspections: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM8 11l2 2 5-4M9 17h6"/>',
        issues: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/>',
        personnel: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M17 15a5 5 0 0 1 4 5"/>',
        support: '<path d="M12 21V9M6 21h12M3 9l9-6 9 6M5 9v7h14V9M8 12h8"/>',
        weekly: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M4 10h16M8 14h3M8 17h7"/>',
        settings: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        arrow: '<path d="m9 5 7 7-7 7"/>',
        search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
        check: '<path d="m5 12 4 4L19 6"/>',
        download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
        camera: '<path d="M3 7h4l2-3h6l2 3h4v14H3z"/><circle cx="12" cy="13" r="4"/>',
        close: '<path d="m6 6 12 12M6 18 18 6"/>'
    };
    const icon = (name, size = 21) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.inspections}</svg>`;
    const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const text = value => esc(value).replace(/\n/g, '<br>');
    const badge = (label, tone) => `<span class="badge ${tone || ({ '营业中': 'green', '筹备中': 'amber', '已完成': 'green', '待整改': 'red', '整改中': 'amber', '待复查': 'blue', '离职': 'neutral', '在职': 'green', '待分配': 'amber', '进行中': 'blue', '暂停': 'neutral' }[label] || 'neutral')}">${esc(label)}</span>`;
    const button = (label, action, id = '', css = 'primary', symbol = '') => `<button type="button" class="btn ${css}" data-action="${esc(action)}" data-id="${esc(id)}">${symbol ? icon(symbol, 18) : ''}${esc(label)}</button>`;
    const empty = (message, label, action, symbol = 'inspections') => `<div class="empty"><div class="empty-symbol">${icon(symbol, 32)}</div><h3>${esc(message)}</h3><p>保存后即可在这里查看和管理。</p>${label ? button(label, action, '', 'primary', 'plus') : ''}</div>`;
    const field = (label, name, value = '', type = 'text', attrs = '') => `<label class="field"><span>${esc(label)}</span><input name="${esc(name)}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
    const area = (label, name, value = '', attrs = '') => `<label class="field full"><span>${esc(label)}</span><textarea name="${esc(name)}" rows="3" ${attrs}>${esc(value)}</textarea></label>`;
    const options = (values, selected) => values.map(value => {
        const key = typeof value === 'string' ? value : value.id;
        const label = typeof value === 'string' ? value : value.name;
        return `<option value="${esc(key)}" ${key === selected ? 'selected' : ''}>${esc(label)}</option>`;
    }).join('');
    const select = (label, name, values, selected = '', attrs = '') => `<label class="field"><span>${esc(label)}</span><select name="${esc(name)}" ${attrs}>${options(values, selected)}</select></label>`;
    const storeSelect = (name = 'storeId', selected = '', allowBlank = false) => select('门店', name, (allowBlank ? [{ id: '', name: '暂不分配门店' }] : []).concat(A.state.stores), selected, allowBlank ? '' : 'required');
    const header = (eyebrow, title, subtitle, action = '') => `<div class="page-heading"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p class="muted">${esc(subtitle)}</p></div>${action}</div>`;
    const search = (placeholder, filters = '') => `<div class="toolbar"><label class="search">${icon('search', 19)}<input id="page-search" type="search" aria-label="搜索" placeholder="${esc(placeholder)}" value="${esc(A.filters.search || '')}"></label>${filters}</div>`;
    let timer;
    function toast(message, error = false) {
        const el = document.getElementById('toast');
        el.textContent = message; el.className = 'show' + (error ? ' error' : '');
        clearTimeout(timer); timer = setTimeout(() => { el.className = ''; }, error ? 6500 : 3200);
    }
    function modal(title, body, form = '', id = '') {
        const el = document.getElementById('editor');
        el.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${esc(title)}</h2><button type="button" class="icon-btn" data-action="close" aria-label="关闭">${icon('close')}</button></div>${form ? `<form data-form="${esc(form)}" data-id="${esc(id)}">${body}<div class="dialog-actions">${button('取消', 'close', '', 'secondary')}<button class="btn primary" type="submit">${icon('check', 18)}保存</button></div></form>` : `<div class="dialog-content">${body}</div>`}`;
        if (!el.open) el.showModal();
    }
    const close = () => document.getElementById('editor').close();
    const details = rows => `<dl class="details">${rows.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${text(value || '—')}</dd></div>`).join('')}</dl>`;
    const photos = values => values.length ? `<div class="photo-grid">${values.map(src => `<button type="button" class="photo" data-action="photo-view"><img src="${esc(src)}" alt="巡店现场照片" loading="lazy"></button>`).join('')}</div>` : '';
    function download(filename, body, mime) {
        const url = URL.createObjectURL(new Blob([body], { type: mime }));
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
    A.ui = { icon, esc, text, badge, button, empty, field, area, options, select, storeSelect, header, search, toast, modal, close, details, photos, download };
})();
