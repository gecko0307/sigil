import fs from "node:fs/promises";
import path from "path";
import map from "./map.mjs";
import npc from "./npc.mjs";
import users from "./users.mjs";
import { success, failure } from "./responce.mjs";

function isCloseTo(px, py, x, y) {
    return (px >= x - 1 && px <= x + 1 &&
            py >= y - 1 && py <= x + 1)
}

async function checkFileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch(error) {
        return false;
    }
}

async function handleInteractAction(socket, user, payload) {
    const { objectId } = payload;
    const mapName = user.map;
    console.log(`[action] Interaction of user ${user.id} on map "${mapName}" with object "${objectId}"`);
    if (map.exists(mapName)) {
        const character = npc.get(objectId);
        if (character) {
            const cx = character.position[0];
            const cy = character.position[1];
            if (isCloseTo(user.x, user.y, cx, cy) === true) {
                const context = user.npcContext[objectId] || "start";
                const dialogFilename = path.join("dialogs", objectId + ".json");
                if (await checkFileExists(dialogFilename)) {
                    const raw = await fs.readFile(dialogFilename, "utf8");
                    const messages = JSON.parse(raw);
                    const message = messages[context];
                    user.npcContext[objectId] = message.context;
                    success(socket, "interact", {
                        type: "dialog",
                        title: character.displayName,
                        message
                    });
                }
                else failure(socket, "interact", "NPC has no dialogs");
            }
            else failure(socket, "interact", "Object is too far away");
        }
        else failure(socket, "interact", "Object was not found");
    }
    else failure(socket, "interact", "Invalid map");
}

export default handleInteractAction;
