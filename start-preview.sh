#!/usr/bin/env bash
set -e
cd -- "$(dirname -- "$0")"
printf '打开 http://localhost:8080 ，按 Ctrl+C 停止。\n'
python3 -m http.server 8080 --bind 127.0.0.1
