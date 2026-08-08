#!/bin/sh
gnome-terminal --title="Server" -- bash -c "cd sigil-server && node src/index.mjs; exec bash"
gnome-terminal --title="Client" -- bash -c "cd sigil-client && npx http-server -p 8000; exec bash"
