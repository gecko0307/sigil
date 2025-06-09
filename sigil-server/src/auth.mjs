import users from "./users.mjs";
import bcrypt from "bcrypt";
import session from "./session.mjs";
import userid from "./userid.mjs";

export async function loginUser(email, password) {
    const user = await users.getUserByEmail(email);
    
    if (user == null) {
        return {
            action: "login",
            result: false,
            message: "User not found"
        };
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return {
            action: "login",
            result: false,
            message: "Invalid password"
        };
    }
    
    users.set(user.id, {
        state: "idle",
        movement: {}
    });
    
    return {
        action: "login",
        result: true,
        payload: {
            userId: user.id,
            sessionId: await session.create(user.id),
            displayName: user.displayName
        }
    };
}

export async function registerUser(email, password, displayName) {
    const newUserId = userid.next();
    const user = users.getUserByEmail(email);
    
    if (user) {
        return {
            action: "register",
            result: false,
            message: "User already exists"
        };
    }
    
    const hash = await bcrypt.hash(password, 10);
    
    users.create(newUserId, {
        id: newUserId,
        email: email,
        password: hash,
        displayName: displayName,
        props: {
            money: 0
        },
        map: "map1",
        x: 0,
        y: 0,
        speed: 5,
        state: "idle",
        movement: {},
        npcContext: {}
    });
    
    return {
        action: "register",
        result: true,
        payload: {
            userId: newUserId,
            sessionId: await session.create(newUserId),
            displayName
        }
    };
}
