# GitHub Pages 部署

适用：现有巡店管理仓库，或新建的 GitHub 仓库。源码无需编译。

## 1. 准备文件

1. 解压本次源码包。
2. 打开 GitHub Desktop，选中巡店系统的仓库。
3. 点击 Repository → Show in Explorer，打开仓库目录。
4. 把本次解压出的文件和文件夹复制进仓库目录，覆盖同名旧网站文件。
5. 检查根目录直接看到 `index.html`，而不是只看到一个外层压缩包目录。
6. 保留 GitHub 仓库自身的 `.git` 目录。只覆盖网站文件，不移动或删除仓库配置。

必须一起上传的文件：`index.html`、`assets/`、`icons/`、`manifest.json`、`service-worker.js`、`.nojekyll`。
说明与测试文件也可以一起提交。不要提交运行应用后导出的业务备份或人员CSV。

## 2. 提交与推送

1. GitHub Desktop 左下角 Summary 填 `Update inspection app v2.0`。
2. 点击 Commit to main。
3. 点击 Push origin。如果是新仓库，先点 Publish repository。
4. 浏览器打开对应 GitHub 仓库，确认网页根目录有本次入口和文件。

## 3. 开启 Pages

在 GitHub 仓库网页：

1. Settings → Pages。
2. Source 选择 Deploy from a branch。
3. Branch 选择 main，目录选择 /(root)。
4. 点击 Save。
5. 等待构建完成，打开 Pages 页面显示的正式网址。

这些设置依据 GitHub 官方文档：
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 4. 手机安装

用手机打开 Pages 提供的 HTTPS 地址。
安卓 Chrome/Edge 的菜单里选择“安装应用”或“添加到主屏幕”。
iPhone Safari 的分享菜单里选择“添加到主屏幕”。
安装后从图标启动，以独立应用窗口打开。它是 PWA，没有提供原生 APK/IPA 安装包。
安装条件和显示入口由浏览器决定，不保证所有第三方内置浏览器都有相同菜单。

## 5. 页面空白或更新未显示

- 检查 `index.html` 是否位于发布目录根部。
- 检查 `assets/js/app.js` 等文件是否真实上传，不能只上传入口。
- 使用 Pages 实际提供的网址，不手工猜测仓库网址。
- 电脑尝试 Ctrl+F5 刷新；手机在“我的与数据”点击“检查页面更新”。
- 发现新版本后会显示“更新页面”。请保存表单再更新。
- 发布后网址必须保持一致，才能读取此前该网址下的本设备记录。
- 请不要通过清除网站数据来处理缓存，否则会删除该设备上的业务记录。

本源码所有资源使用相对路径，既可从站点根目录运行，也可从仓库子目录运行。
路由使用 `#stores` 等哈希地址，不依赖服务器 rewrite。

## 6. 后续发布

每次修改源码后更新 `service-worker.js` 的 VERSION 和界面版本，再提交推送。
不要把 JSON 备份、导出的人员名单和巡店照片加入公开仓库。
业务数据由浏览器保存，GitHub Pages 只发布程序文件。
