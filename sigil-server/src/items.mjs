import fs from "fs";

const items = new Map();

function init() {
    loadItemsFromFile("items/food.json");
}

function loadItemsFromFile(filename) {
    if (!fs.existsSync(filename)) return;
    const raw = fs.readFileSync(filename, "utf8");
    const data = JSON.parse(raw);
    Object.keys(data).forEach(id => {
        const item = data[id];
        const itemObject = {
            id: id,
            soulbound: item.soulbound || false,
            class: item.class || 0,
            price: item.price || 0,
            edible: item.edible || false,
            wearable: item.wearable || false,
            effect: item.effect || {},
            equipType: item.equipType || "none",
            equipEffect: item.equipEffect || {}
        };
        items.set(id, itemObject);
    });
}

function get(id) {
    return items.get(id);
}

export default {
    init,
    get
};
