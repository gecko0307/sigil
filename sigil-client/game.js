// Game object
var Game = {
    playerProps: {
        level: 1,
        xp: 0,
        hp: 100,
        mp: 100,
        xpToNextLevel: 0
    },
    
    clickableObjects: []
};

Game.tileSize = 32;

function onPhaserLoadProgress(progress) {
    const bar = document.getElementById("loading_progress");
    if (bar) bar.style.width = `${Math.floor(progress * 100)}%`;
}

Game.preload = function() {
    Game.scene = this;
    
    this.load.on("progress", onPhaserLoadProgress);
    
    // Map
    this.load.image("village1", "data/maps/village1.png");
    this.load.tilemapTiledJSON("map1", "data/maps/map1.json");
    
    // Player spritesheet
    this.load.spritesheet("player", 
        "data/characters/1.png",
        { frameWidth: 32, frameHeight: 48 }
    );
    
    // NPC sprites
    this.load.spritesheet("npc_fallback", 
        "data/characters/npc_fallback.png",
        { frameWidth: 32, frameHeight: 48 }
    );

    this.load.spritesheet("doriana", 
        "data/characters/doriana.png",
        { frameWidth: 32, frameHeight: 48 }
    );
    
    // Red cross image to mark target position
    this.load.image("cross", "data/ui/cross.png");
    
    var keyset = new Set();
    
    this.input.keyboard.on("keydown", function(event) {
        if (!keyset.has(event.code)) {
            keyset.add(event.code);
            if (Game.keyDown)
                Game.keyDown(event.code);
        }
    });
    
    this.input.keyboard.on("keyup", function(event) {
        keyset.delete(event.code);
        if (Game.keyUp)
            Game.keyUp(event.code);
    });
    
    Game.keyPressed = function(code) {
        return keyset.has(code);
    }
}

Game.create = function() {
    this.input.on("pointerup", Game.handleClick);
    
    Game.camera = this.cameras.main;
    
    // Map setup
    Game.map = this.add.tilemap("map1");
    
    var village1 = Game.map.addTilesetImage("village1", "village1");
    
    // Background layer - rendered behind all other objects (ground tiles)
    Game.backgroundLayer = Game.map.createLayer("background", village1);
    Game.backgroundLayer.setDepth(-3);
    
    // Scenery layer - non-interactive objects behind the player (like plants and rocks)
    Game.sceneryLayer = Game.map.createLayer("scenery", village1);
    Game.sceneryLayer.setDepth(-2);
    
    // Foreground layer - non-interactive objects above the player (like tree crowns)
    Game.foregroundLayer = Game.map.createLayer("foreground", village1);
    Game.foregroundLayer.setDepth(1000000);
    
    // Collision layer - invisible non-traversable tiles, used for path finding
    Game.collisionLayer = Game.map.createLayer("collision", village1);
    Game.collisionLayer.visible = false;
    
    // Player animations
    var walkDown = {
        key: "walkDown",
        frames: this.anims.generateFrameNumbers("player", {
            start: 0,
            end: 3
        }),
        repeat: -1,
        frameRate: 10
    };
    this.anims.create(walkDown);
    
    var walkLeft = {
        key: "walkLeft",
        frames: this.anims.generateFrameNumbers("player", {
            start: 4,
            end: 7
        }),
        repeat: -1,
        frameRate: 10
    };
    this.anims.create(walkLeft);

    var walkRight = {
        key: "walkRight",
        frames: this.anims.generateFrameNumbers("player", {
            start: 8,
            end: 11
        }),
        repeat: -1,
        frameRate: 10
    };
    this.anims.create(walkRight);
    
    var walkUp = {
        key: "walkUp",
        frames: this.anims.generateFrameNumbers("player", {
            start: 12,
            end: 15
        }),
        repeat: -1,
        frameRate: 10
    };
    this.anims.create(walkUp);
    
    // Player sprite
    Game.player = this.add.sprite(Game.tileSize * 0.5, Game.tileSize * 0.5, "player");
    Game.player.setDisplayOrigin(16, 32);
    Game.player.depth = 0;
    Game.player.anims.play("walkDown");
    Game.player.anims.stop();
    
    // Cross sprite
    Game.cross = this.add.sprite(0, 0, "cross");
    Game.cross.depth = -1;
    Game.cross.visible = false;
    
    Game.hintText = this.add.text(0, 0, "This is the hint!", {
        font: "14px Arial",
        fill: "#000000",
        backgroundColor: "#f1efb8",
        padding: { x: 5, y: 3 }
    }).setDepth(100); // Set a higher depth so it's on top of the sprite
    Game.hintText.visible = false; // Initially hide the hint
    Game.hintText.alpha = 0.9;

    connect();
}

var dialog = document.getElementById("dialog_container");
var dialogMessage = document.getElementById("dialog_message");
var dialogVisible = false;
var dialogBtnQuit = document.getElementById("dialog_btn_quit");

dialogBtnQuit.onclick = function() {
    gsap.set(dialog, { pointerEvents: "none" });
    gsap.to(dialog, 0.25, { visibility: "hidden", autoAlpha: 0 });
    dialogVisible = false;
};

function showDialog(title, message) {
    dialogVisible = true;
    dialogMessage.innerHTML = message.text;
    if (message.text.length > 300)
        gsap.set(dialog, { height: 300 });
    else
        gsap.set(dialog, { height: 200 });
    gsap.fromTo(dialog, 0.25, { visibility: "visible", autoAlpha: 0, scaleY: 0 }, { autoAlpha: 1, scaleY: 1, onComplete: function() {
        gsap.set(dialog, { pointerEvents: "auto" });
    }});
}

function playerIsCloseTo(x, y) {
    var tileX = Math.floor(x / Game.tileSize);
    var tileY = Math.floor(y / Game.tileSize);
    var playerTileX = Math.floor(Game.player.x / Game.tileSize);
    var playerTileY = Math.floor(Game.player.y / Game.tileSize);    
    return (playerTileX >= tileX - 1 && playerTileX <= tileX + 1 &&
            playerTileY >= tileY - 1 && playerTileY <= tileY + 1)
}

function playerIsCloseToObject(obj) {
    return playerIsCloseTo(obj.x, obj.y);
}

function getClickableObjectAt(x, y) {
    var toX = Math.floor(x / Game.tileSize);
    var toY = Math.floor(y / Game.tileSize);
    var tileX = Math.floor(toX * Game.tileSize + Game.tileSize * 0.5);
    var tileY = Math.floor(toY * Game.tileSize + Game.tileSize * 0.5);
    var obj = null;
    for (var i = 0; i < Game.clickableObjects.length; i++) {
        var o = Game.clickableObjects[i];
        if (tileX == o.x && tileY == o.y) {
            obj = o;
            break;
        }
    }
    return obj;
}

function handleInteractionWith(obj) {
    console.log("Interaction with: ", obj.type, obj.name);

    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not connected.");
        return;
    }
    
    const message = {
        action: "interact",
        payload: {
            sessionId,
            objectId: obj.name
        }
    };
    ws.send(JSON.stringify(message));
}

Game.handleClick = function(pointer) {
    if (dialogVisible) return;
    
    var x = clamp(Game.camera.scrollX + pointer.x, 0, 10000);
    var y = clamp(Game.camera.scrollY + pointer.y, 0, 10000);

    var obj = getClickableObjectAt(x, y);
    
    if (obj) {
        // Check just for less server-side work
        if (playerIsCloseToObject(obj)) {
            handleInteractionWith(obj);
            Game.hintText.visible = false;
        }
    }
    else {
        // Convert pointer coordinates to grid coordinates
        // and initiate movement
        var gridX = Math.floor(x / Game.tileSize);
        var gridY = Math.floor(y / Game.tileSize);
        playerGoTo(gridX, gridY);
    }
};

// Try to move the player to [x, y] in the grid
function playerGoTo(x, y) {
    // Remove current movement timeline, if any
    if (Game.playerMovement)
    {
        Game.player.anims.stop();
        Game.playerMovement.stop();
        Game.playerMovement.destroy();
    }
    
    // Set target sprite
    Game.cross.x = x * Game.tileSize + Game.tileSize * 0.5;
    Game.cross.y = y * Game.tileSize + Game.tileSize * 0.5;
    Game.cross.visible = true;

    // Request movement path from server
    serverMove(x, y);
}

// Update player sprite position
Game.setCharacterPosition = function(x, y) {
    Game.player.x = Game.tileSize * 0.5 + x * Game.tileSize;
    Game.player.y = Game.tileSize * 0.5 + y * Game.tileSize;
}

// Move player along the EasyStar.js path using a timeline.
// Path is an array of {x, y} objects.
Game.moveCharacter = function(path, duration)
{
    var tweens = [];
    for(var i = 0; i < path.length-1; i++) {
        // From [px, py] to [tx, ty]
        var px = path[i].x;
        var py = path[i].y;
        
        var tx = path[i+1].x;
        var ty = path[i+1].y;

        tweens.push({
            duration: duration,
            x: Game.tileSize * 0.5 + tx * Game.tileSize,
            y: Game.tileSize * 0.5 + ty * Game.tileSize,
            onStart: function(tween, object, dx, dy) {
                // Set player animation on each tween start
                if (dx == "0" && dy == "1") Game.player.anims.play("walkDown");
                else if (dx == "0" && dy == "-1") Game.player.anims.play("walkUp");
                else if (dx == "1" && dy == "0") Game.player.anims.play("walkRight");
                else if (dx == "-1" && dy == "0") Game.player.anims.play("walkLeft");
            },
            onStartParams: [tx - px, ty - py]
        });
    }

    Game.playerMovement = Game.scene.tweens.chain({
        targets: Game.player,
        tweens: tweens
    });

    Game.playerMovement.on(Phaser.Time.Events.COMPLETE, function() {
        Game.player.anims.stop();
        Game.cross.visible = false;
    });

    Game.playerMovement.play();
};

function sqr(val) {
    return val * val;
}

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

Game.update = function(time, delta) {
    // Position camera around the player, clamp to map borders
    Game.camera.scrollX = Game.player.x - 400;
    Game.camera.scrollY = Game.player.y - 300;
    Game.camera.scrollX = clamp(Game.camera.scrollX, 0, Game.map.widthInPixels - 800);
    Game.camera.scrollY = clamp(Game.camera.scrollY, 0, Game.map.heightInPixels - 600);
    Game.player.depth = Math.floor(Game.player.y / Game.tileSize);
    
    // Update properties UI
    updatePlayerProps();
}

Game.keyDown = function(code) {
    console.log(code);
}

function createNPCs(npcs) {
    for (var i = 0; i < npcs.length; i++) {
        var npc = npcs[i];
        //console.log("Adding NPC", npc);
        var x = npc.position[0];
        var y = npc.position[1];
        var textureKey = Game.scene.textures.exists(npc.sprite) ? npc.sprite : "npc_fallback";
        var npcSprite = Game.scene.add.sprite(
            x * Game.tileSize + Game.tileSize * 0.5, 
            y * Game.tileSize + Game.tileSize * 0.5, textureKey);
        npcSprite.setDisplayOrigin(16, 32);
        npcSprite.depth = y;
        npcSprite.name = npc.id;
        npcSprite.displayName = npc.displayName || "";
        npcSprite.type = npc.type;
        npcSprite.setInteractive({ useHandCursor: true });
        npcSprite.on("pointerover", function(pointer) {
            Game.hintText.setText(npcSprite.displayName);
            Game.hintText.setPosition(
                Game.camera.scrollX + pointer.x + 10,
                Game.camera.scrollY + pointer.y + 10);
            Game.hintText.visible = true;
        });
        npcSprite.on("pointerout", function() {
            Game.hintText.visible = false;
        });
        Game.clickableObjects.push(npcSprite);
    }
}

function updatePlayerProps() {
    Game.playerProps.level = Math.floor((Math.sqrt(100 * (2 * Game.playerProps.xp + 25)) + 50) / 100);
    Game.playerProps.xpToNextLevel = (sqr(((Game.playerProps.level + 1) * 100) - 50) / 100 - 25) * 0.5;
    var xpCurLevel = (sqr((Game.playerProps.level * 100) - 50) / 100 - 25) * 0.5;
    var val = ((Game.playerProps.xp - xpCurLevel) / (Game.playerProps.xpToNextLevel - xpCurLevel));
    val *= 100;
    var circle = document.getElementById("xp_bar_progress");
    var r = 25;
    var circumf = 2 * r * Math.PI;
    var percentV = (val / 100) * circumf;
    circle.style.strokeDasharray = percentV + " " + circumf;
    
    var playerLevel = document.getElementById("player_level");
    playerLevel.innerHTML = Game.playerProps.level;
    
    var playerXp = document.getElementById("player_xp");
    playerXp.innerHTML = "XP: " + Game.playerProps.xp + " / " + Game.playerProps.xpToNextLevel;
}

// Phaser game config
var phaserConfig = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    parent: "canvas_container",
    backgroundColor: "#73b857",
    pixelArt: true,
        render: {
        contextCreation: {
            willReadFrequently: true
        }
    },
    audio: {
        noAudio: true
    },
    scene: [Game]
};

// Game object instance
var game = new Phaser.Game(phaserConfig);

//////////////////

// WebSocket client

let ws;
let sessionId;

function wsServerURL() {
    var isLocalhost =
        window.location.hostname == "localhost" ||
        window.location.hostname == "127.0.0.1";
    if (isLocalhost)
        return "ws://localhost:8050";
    else
        return "wss://cloud.timurgafarov.ru/sigil-server/";
}

function connect() {
    if (ws) {
        ws.close();
    }
    
    ws = new WebSocket(wsServerURL());
    
    ws.onopen = () => {
        console.log("Connected to WebSocket server.");
        
        sessionId = localStorage.getItem("sigil_sessionId");
        if (sessionId) {
            validateSession(sessionId);
        }
        else {
            window.location.href = "index.html";
        }
    };
    
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log("Server response:", msg);
        if (msg.action === "sync") {
            if (msg.result) {
                // TODO: sync other properties
                Game.setCharacterPosition(msg.payload.x, msg.payload.y);
                document.getElementById("loading_overlay").style.display = "none";
                serverGetLocationContent();
            }
        }
        else if (msg.action === "move") {
            if (msg.result) {
                Game.moveCharacter(msg.payload.path, msg.payload.duration);
            }
            else if (msg.message == "Invalid session") {
                relogin(msg.message);
            }
        }
        else if (msg.action === "interact") {
            if (msg.result) {
                if (msg.payload.type === "dialog") {
                    showDialog(msg.payload.title, msg.payload.message);
                }
                else { // TODO
                }
            }
            else {
                // no-op
            }
        }
        else if (msg.action === "location") {
            if (msg.result) {
                createNPCs(msg.payload.npc);
            }
            else if (msg.message == "Invalid session") {
                relogin(msg.message);
            }
        }
        else if (msg.action === "validate") {
            if (msg.result) sync(sessionId);
            else relogin(msg.message);
        }
    };

    ws.onclose = () => {
        ws = null;
        relogin("Connection closed");
    };

    ws.onerror = (err) => {
        ws = null;
        relogin("WebSocket error " + err);
    };
}

function validateSession(sessionId) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not connected.");
        return;
    }
    
    const message = {
        action: "validate",
        payload: { sessionId }
    };
    ws.send(JSON.stringify(message));
}

function sync(sessionId) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not connected.");
        return;
    }
    
    const message = {
        action: "sync",
        payload: { sessionId }
    };
    ws.send(JSON.stringify(message));
}

function serverMove(x, y) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not connected.");
        return;
    }
    
    const message = {
        action: "move",
        payload: {
            sessionId,
            x, y
        }
    };
    ws.send(JSON.stringify(message));
}

function serverGetLocationContent() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not connected.");
        return;
    }
    
    const message = {
        action: "location",
        payload: {
            sessionId
        }
    };
    ws.send(JSON.stringify(message));
}

function closeConnection() {
    if (ws) {
        ws.close();
    }
}

function relogin(message) {
    console.log(message || "Unknown error");
    closeConnection();
    localStorage.removeItem("sigil_sessionId");
    window.location.href = "index.html";
}
