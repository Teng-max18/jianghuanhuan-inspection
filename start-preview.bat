@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>&1
if not errorlevel 1 (
    start "" "http://localhost:8080"
    py -m http.server 8080 --bind 127.0.0.1
    goto :eof
)
where python >nul 2>&1
if not errorlevel 1 (
    start "" "http://localhost:8080"
    python -m http.server 8080 --bind 127.0.0.1
    goto :eof
)
echo 未检测到 Python。直接双击 index.html 可检查页面和保存功能。
echo 手机安装与离线测试请使用 GitHub Pages 的 HTTPS 网址。
start "" "%~dp0index.html"
pause
