import map from "./map.mjs";
import users from "./users.mjs";
import { success, failure } from "./responce.mjs";

async function handleMoveAction(socket, user, payload) {
    const { x, y } = payload;
    const mapName = user.map;
    console.log(`[action] Moving user ${user.id} on map "${mapName}" to [${x}, ${y}]`);
    if (map.exists(mapName)) {
        map.getPath(mapName, user.x, user.y, x, y, function(path){
            if (path && path.length > 1) {
                const duration = (1.0 / user.speed) * 1000;
                const interval = path.length * duration;
                users.set(user.id, {
                    state: "moving",
                    movement: {
                        path,
                        startTime: Date.now(),
                        duration,
                        interval,
                        x, y
                    }
                });
                success(socket, "move", { path, duration });
            }
            else failure(socket, "move", "Path was not found");
        });
    }
    else failure(socket, "move", "Invalid map");
}

export default handleMoveAction;
