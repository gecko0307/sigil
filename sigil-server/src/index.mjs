import WebSocket, { WebSocketServer } from "ws";
import users from "./users.mjs";
import { loginUser, registerUser } from "./auth.mjs";
import session from "./session.mjs";
import npc from "./npc.mjs";
import map from "./map.mjs";
import actions from "./actions.mjs";
import { success, failure } from "./responce.mjs";

npc.init();
map.init();

let logEnabled = false;

let wss = new WebSocketServer({
    port: 8050
});

wss.on("connection", (ws) => {
    ws.on("error", console.error);
    
    console.log("[server] Client connected");
    
    ws.on("message", async (buffer) => {
        const message = buffer.toString("utf-8");
        if (logEnabled) console.log("[server] Message:", message);
        const { action, payload } = JSON.parse(message);
        if (action in actions) {
            const sessionId = payload.sessionId;
            if (session.isValid(sessionId)) {
                const userId = session.getUserId(sessionId);
                const user = users.get(userId);
                if (user) {
                    // Dispatch action
                    await actions[action](ws, user, payload);
                }
                else {
                    session.destroy(sessionId);
                    failure(ws, action, "Invalid user");
                }
            }
            else {
                failure(ws, action, "Invalid session");
            }
        }
        else if (action === "login") {
            // Try to sign in
            const { email, password } = payload;
            const response = await loginUser(email, password);
            ws.send(JSON.stringify(response));
        }
        else if (action === "register") {
            // Try to register a new user
            const { email, password, displayName } = payload;
            const response = await registerUser(email, password, displayName);
            ws.send(JSON.stringify(response));
        }
        else {
            console.log("[server] Unknown action:", action);
            failure(ws, action, "Invalid action");
        }
    });
    
    ws.on("close", () => {
        console.log("[server] Client disconnected");
        users.saveIfDirty();
    });
});

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

const updateIntervalSec = 0.1;
const updateIntervalMsec = 100;
const saveIntervalSec = 30;
let saveTimer = 0;

async function gameLoop() {
    saveTimer += updateIntervalSec;
    const currentTime = Date.now();
    
    session.forEachSession(function(sess, sessionId, map){
        const user = users.get(sess.userId);
        if (user == null) {
            if (logEnabled) console.log(`Session ${sessionId} has no matching user`);
        }
        else if (user.state === "moving") {
            updateUserMovement(user, currentTime);
        }
    });
    
    if (saveTimer >= saveIntervalSec) {
        saveTimer = 0;
        users.saveIfDirty();
    }
}

function updateUserMovement(user, currentTime) {
    const movement = user.movement;
    if ("startTime" in movement)
    {
        const timeDelta = currentTime - movement.startTime;
        if (timeDelta >= movement.interval) {
            users.set(user.id, {
                x: movement.x,
                y: movement.y,
                state: "idle",
                movement: {}
            });
        }
        else {
            const progress = clamp(timeDelta / movement.interval, 0.0, 1.0);
            const i = Math.floor(progress * movement.path.length);
            users.set(user.id, {
                x: movement.path[i].x,
                y: movement.path[i].y
            });
        }
    }
}

let logicsInterval = setInterval(gameLoop, updateIntervalMsec);

function terminate() {
    if (wss) {
        wss.clients.forEach(client => client.terminate());
        wss.close(() => {
            console.log("[process] WebSocket server stopped");
            wss = null;
        });
    }
    
    if (logicsInterval) {
        clearInterval(logicsInterval);
        logicsInterval = null;
    }
    
    users.saveIfDirty();
}

process.on("SIGTERM", () => {
    console.log("[process] SIGTERM signal received");
    terminate();
});

process.on("SIGINT", () => {
    console.log("[process] SIGINT signal received");
    terminate();
});

console.log("[process] Sigil is running on ws://localhost:8080");
