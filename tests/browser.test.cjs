'use strict';
// 在装有 Playwright + Chromium 的开发环境运行。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require(require.resolve('playwright', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || ''] })); }
const url = process.env.APP_TEST_URL || 'http://localhost:8765/inspection-source/';
const output = process.env.APP_TEST_OUTPUT || path.join(process.cwd(), 'browser-test-output');
fs.mkdirSync(output, { recursive: true });
(async () => {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    try {
        await page.goto(url); await page.waitForSelector('main h1');
        assert.equal(await page.evaluate(() => Inspect.state.stores.length), 22);
        await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
        for (const width of [390, 320]) {
            await page.setViewportSize({ width, height: 844 });
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'mobile overflow ' + width);
        }
        await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => { location.hash = 'stores'; });
        await page.waitForFunction(() => Inspect.route === 'stores');
        await page.locator('#page-search').focus();
        await page.evaluate(() => { window.testSearchNode = document.querySelector('#page-search'); });
        await page.locator('#page-search').pressSequentially('abc', { delay: 180 });
        assert.equal(await page.locator('#page-search').inputValue(), 'abc');
        assert.equal(await page.evaluate(() => testSearchNode === document.querySelector('#page-search') && document.activeElement === testSearchNode), true);
        await page.locator('#page-search').fill('');
        await page.evaluate(() => {
            const input = document.querySelector('#page-search');
            input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
            input.value = 'tianlun';
            input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
            input.value = '天伦';
            input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
            input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: false }));
        });
        await page.waitForFunction(() => document.querySelectorAll('.store-card').length === 1);
        assert.equal(await page.locator('#page-search').inputValue(), '天伦');
        assert.equal(await page.evaluate(() => testSearchNode === document.querySelector('#page-search')), true);
        assert.equal(await page.locator('.store-card h2').innerText(), '天伦路店');
        await page.evaluate(() => { location.hash = 'home'; });
        await page.waitForFunction(() => Inspect.route === 'home');
        await page.locator('[data-action="inspection-new"]').first().click();
        await page.locator('#editor [name="summary"]').fill('自动化测试巡店');
        await page.locator('#editor [name="issueDescription"]').fill('自动化测试整改');
        await page.locator('#editor [name="check-hygiene"]').selectOption('合格');
        await page.locator('#photo-input').setInputFiles(path.join(__dirname, '../icons/icon-192.png'));
        await page.waitForSelector('#draft-photos img');
        await page.locator('#editor button[type="submit"]').click();
        await page.waitForFunction(() => !document.querySelector('#editor').open);
        assert.equal(await page.evaluate(() => Inspect.state.inspections.length), 1);
        assert.equal(await page.evaluate(() => Inspect.state.inspections[0].photos.length), 1);
        await page.reload(); await page.waitForSelector('main h1');
        assert.equal(await page.evaluate(() => Inspect.state.inspections[0].summary), '自动化测试巡店');
        for (const route of ['stores', 'inspections', 'issues', 'personnel', 'support', 'weekly', 'settings']) {
            await page.evaluate(route => { location.hash = route; }, route);
            await page.waitForFunction(route => Inspect.route === route, route);
            assert.ok((await page.locator('main h1').innerText()).length);
        }
        const downloadPromise = page.waitForEvent('download');
        await page.locator('[data-action="backup-export"]').click();
        const download = await downloadPromise; const backupPath = path.join(output, 'backup.json'); await download.saveAs(backupPath);
        const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8')); assert.equal(backup.data.inspections.length, 1);
        await page.locator('[data-action="reset-open"]').click();
        await page.locator('#editor [name="confirmation"]').fill('重置');
        await page.locator('#editor button[type="submit"]').click(); await page.waitForFunction(() => Inspect.state.inspections.length === 0);
        await page.locator('#backup-input').setInputFiles(backupPath); await page.waitForFunction(() => Inspect.state.inspections.length === 1);
        await page.evaluate(async () => { await navigator.serviceWorker.ready; });
        await page.reload(); await page.waitForSelector('main h1');
        await context.setOffline(true); await page.reload(); await page.waitForSelector('main h1');
        assert.equal(await page.evaluate(() => Inspect.state.inspections.length), 1);
        assert.equal(errors.length, 0, errors.join('\n'));
        console.log('PASS 浏览器页面、320/390px布局、照片压缩、保存重开、JSON恢复与离线重开');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
