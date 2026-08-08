start "Server" /D sigil-server node src/index.mjs
start "Client" /D sigil-client npx http-server -p 8000
