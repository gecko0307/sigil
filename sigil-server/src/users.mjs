import fs from "fs";

const SAVE_FILE = "db/users.json";

class UserStorage {
    constructor() {
        this.users = new Map(); // userId -> userData
        this.dirty = false;
    }

    load() {
        if (!fs.existsSync(SAVE_FILE)) return;
        const raw = fs.readFileSync(SAVE_FILE, "utf8");
        const arr = JSON.parse(raw);
        this.users = new Map(arr);
        console.log(`[users] Loaded ${this.users.size} users`);
    }

    saveIfDirty() {
        if (this.users.size === 0 || !this.dirty) return;
        console.log(`[users] Saving...`);
        const data = JSON.stringify([...this.users.entries()], null, 2);
        fs.writeFileSync(SAVE_FILE, data);
        this.dirty = false;
    }

    create(userId, userData) {
        this.users.set(userId, userData);
        this.dirty = true;
    }
    
    set(userId, newData) {
        const user = this.users.get(userId);
        if (user) {
            Object.assign(user, newData);
            this.dirty = true;
        }
    }

    get(userId) {
        return this.users.get(userId);
    }
    
    getUserByEmail(email) {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }

    delete(userId) {
        this.users.delete(userId);
        this.dirty = true;
    }

    has(userId) {
        return this.users.has(userId);
    }

    count() {
        return this.users.size;
    }

    getAll() {
        return [...this.users.values()];
    }
}

const users = new UserStorage();
users.load();

export default users;
