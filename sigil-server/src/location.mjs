import map from "./map.mjs";
import { success } from "./responce.mjs";

async function handleLocationAction(socket, user, payload) {
    const mapName = user.map;
    if (map.exists(mapName)) {
        success(socket, "location", map.getContents(mapName));
    }
}

export default handleLocationAction;
