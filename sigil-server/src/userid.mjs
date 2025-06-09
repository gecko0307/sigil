import fs from "fs";

const META_FILE = "db/meta.json";

class IDGenerator {
    constructor() {
        this.counter = 0;
        this.load();
    }

    load() {
        if (fs.existsSync(META_FILE)) {
            const raw = fs.readFileSync(META_FILE, "utf8");
            const data = JSON.parse(raw);
            this.counter = data.nextUserId || 0;
        }
    }

    save() {
        const data = { nextUserId: this.counter };
        fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2));
    }

    next() {
        const id = this.counter;
        this.counter++;
        this.save();
        return id;
    }
}

const idGen = new IDGenerator();
idGen.load();

export default idGen;
