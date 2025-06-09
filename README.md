# Sigil
This is a minimal engine/template for a browser-based pixelart 2D online RPG that I've written for fun while learning [Phaser 3](https://phaser.io/), an awesome HTML5 game engine. It is mostly inspired by [Margonem](https://margonem.com/).

It is **occasionally** available online at [https://cloud.timurgafarov.ru/sigil-demo/](https://cloud.timurgafarov.ru/sigil-demo/).

Implemented features:
* Game client and server
* Registration and authentication
* Grid-based point-and-click movement using [EasyStar.js](https://www.easystarjs.com/) pathfinding library
* Tile-based maps using [Tiled](https://www.mapeditor.org) for an editor
* Character animation
* NPC citizens
* Basic GUI and a dialog system

TODO:
* Display other users
* Inventory and items
* Quests
* Battle system
* Enemies

[![Screenshot](screenshot.jpg)](screenshot.jpg)

## Installation

Installing Sigil on a Linux server is very easy: just do `npm install` and copy all the files to the dedicated server directory, for example `/opt/sigil`. Then add a `sigil.service` to `/etc/systemd/system`:

```
[Unit]
Description=Sigil WebSocket Server
After=network.target

[Service]
ExecStart=node /opt/sigil/src/index.mjs
WorkingDirectory=/opt/sigil
Restart=always
RestartSec=5
Environment=NODE_ENV=production
User=<your server user>
Group=<your server group>

[Install]
WantedBy=multi-user.target
```

Make sure that your server user has write access to `/opt/sigil/db`.

Then run

```
sudo systemctl daemon-reload
sudo systemctl enable --now sigil
```

Configure your reverse proxy to route `/sigil-server` to `localost:8050`.

Copy the client to your publicly available web folder, for example `var/www/html/sigil-client`, and you are done.
