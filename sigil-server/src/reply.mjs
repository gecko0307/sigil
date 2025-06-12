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

async function handleReplyAction(socket, user, payload) {
    const { objectId, context, replyIndex } = payload;
    const mapName = user.map;
    console.log(`[action] Reply of user ${user.id} on map "${mapName}" to object "${objectId}"`);
    if (map.exists(mapName)) {
        const character = npc.get(objectId);
        if (character) {
            const cx = character.position[0];
            const cy = character.position[1];
            if (isCloseTo(user.x, user.y, cx, cy) === true) {
                const dialogFilename = path.join("dialogs", objectId + ".json");
                if (await checkFileExists(dialogFilename)) {
                    const raw = await fs.readFile(dialogFilename, "utf8");
                    const messages = JSON.parse(raw);
                    const message = messages[context];
                    if (message.actions[replyIndex]) {
                        const action = message.actions[replyIndex];
                        user.npcContext[objectId] = action.context;
                        success(socket, "interact", {
                            type: "trade",
                            title: character.displayName,
                            supply: character.supply
                        });
                    }
                    else failure(socket, "reply", "Invalid replyIndex");
                }
                else failure(socket, "reply", "NPC has no dialogs");
            }
            else failure(socket, "reply", "Object is too far away");
        }
        else failure(socket, "reply", "Object was not found");
    }
    else failure(socket, "reply", "Invalid map");
}

export default handleReplyAction;
