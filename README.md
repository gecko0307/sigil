# Sigil
This is a minimal engine/template for a browser-based pixelart 2D online RPG that I've written for fun while learning [Phaser 3](https://phaser.io/), an awesome HTML5 game engine. It is mostly inspired by [Margonem](https://margonem.com/).

Sigil features a semi-realtime WebSocket server that updates the global state with 0.1s intervals. It has almost zero overhead when no players are logged in.

Implemented features:
* Game client (HTML5 + Phaser) and server (Node.js)
* Registration and authentication
* Grid-based point-and-click movement using [EasyStar.js](https://www.easystarjs.com/) pathfinding library
* Tile-based maps using [Tiled](https://www.mapeditor.org) for an editor. Multi-layer maps
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

## Prerequisites

* Node.js 14 or higher

Run `npm install` in `sigil-server` to install server-side dependencies. Client is fully self-sufficient.

## Running Locally

Run `run.sh` (or `run.bat` on Windows).

## Installation

Installing Sigil on a Linux server is very easy: just copy all the files to the dedicated server directory, for example `/opt/sigil`. Then add a `sigil.service` to `/etc/systemd/system`:

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

Sigil by default opens port 8050 on `localhost`. I don't recommend binding it directly to `0.0.0.0`. Instead, use a reverse proxy and configure it to route a subdirectory `/sigil-server` to `localost:8050`. For example, this is how it can be done with Caddy:

```
mygame.com {
    root * /var/www/html/sigil-client
    file_server
    
    reverse_proxy /sigil-server* localhost:8050 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

Copy `sigil-client` to your publicly available web folder (`var/www/html/sigil-client` in the example above).

Modify `sigil-client/config.js`. `sigilProductionServer` global variable should contain public URL of your server:

```javascript
var sigilProductionServer = "wss://mygame.com/sigil-server/";
```
