import * as fs from "fs";
import EasyStar from "easystarjs";
import npc from "./npc.mjs";

const TILE_SIZE = 32;

const maps = {
};

function load(mapName) {
    const mapFilename = `maps/${mapName}.json`;
    const mapData = JSON.parse(fs.readFileSync(mapFilename, "utf8"));
    const collisionLayer = mapData.layers.find(layer => layer.name === "collision");
    const width = mapData.width;
    const height = mapData.height;

    let grid = [];

    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            row.push(collisionLayer.data[index]);
        }
        grid.push(row);
    }
    
    // Add NPCs to collision grid
    const npcLayer = mapData.layers.find(layer => layer.name === "npc");
    const npcs = npcLayer.objects;
    const mapNpcData = [];
    for (let i = 0; i < npcs.length; i++)
    {
        var x = Math.floor(npcs[i].x / TILE_SIZE);
        var y = Math.floor(npcs[i].y / TILE_SIZE);
        var numTilesH = Math.floor(npcs[i].width / TILE_SIZE);
        var numTilesV = Math.floor(npcs[i].height / TILE_SIZE);
        
        for (var tx = x; tx < x + numTilesH; tx++)
        for (var ty = y; ty < y + numTilesV; ty++)
        {
            grid[ty][tx] = 1;
        }

        const id = npcs[i].name;
        const npcData = npc.get(id) || {};
        npcData.map = mapName;
        npcData.position = [x, y];
        
        npc.set(npcs[i].name, npcData);
        mapNpcData.push(npcData);
    }
    
    const pathFinder = new EasyStar.js();
    pathFinder.setGrid(grid);
    pathFinder.setAcceptableTiles([0]);
    
    maps[mapName] = {
        width, height,
        pathFinder,
        contents: {
            npc: mapNpcData
            // TODO: other content objects
        }
    };
    
    console.log(`[maps] Map "${mapName}" loaded successfully`);
}

function init() {
    // TODO: load everything in "maps" folder
    load("map1");
}

function exists(mapName) {
    return (mapName in maps);
}

function getPath(mapName, fromX, fromY, toX, toY, callback) {
    const map = maps[mapName];
    const pathFinder = map.pathFinder;
    pathFinder.findPath(fromX, fromY, toX, toY, callback);
    pathFinder.calculate();
}

function getContents(mapName) {
    return maps[mapName].contents;
}

export default {
    init,
    exists,
    getPath,
    getContents
};
