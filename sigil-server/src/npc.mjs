import fs from "fs";

const NPC_FILE = "objects/npc.json";

const npcs = new Map();

function init() {
    if (!fs.existsSync(NPC_FILE)) return;
    const raw = fs.readFileSync(NPC_FILE, "utf8");
    const data = JSON.parse(raw);
    Object.keys(data).forEach(id => {
        const npc = data[id];
        const npcObject = {
            id: id,
            type: ["npc", ...(npc.type || [])],
            sprite: npc.sprite || "npc_fallback",
            map: npc.map || "",
            position: npc.position || [0, 0],
            displayName: npc.displayName || id,
            supply: npc.supply || []
        };
        npcs.set(id, npcObject);
    });
}
    
function set(id, newData) {
    const npc = npcs.get(id);
    if (npc) {
        Object.assign(npc, newData);
    }
}

function get(id) {
    return npcs.get(id);
}

export default {
    init,
    set,
    get
};
