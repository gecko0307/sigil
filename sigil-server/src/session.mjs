import { nanoid } from "nanoid";

const sessions = new Map();

const SESSION_TTL = 10 * 60 * 1000; // 10 minutes

async function create(userId) {
    const sessionId = nanoid();
    sessions.set(sessionId, {
        userId,
        lastActivity: Date.now()
    });
    return sessionId;
}

function isValid(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return false;
    if (Date.now() - session.lastActivity > SESSION_TTL) {
        sessions.delete(sessionId);
        return false;
    }
    session.lastActivity = Date.now();
    return true;
}

function getUserId(sessionId) {
    const session = sessions.get(sessionId);
    if (session) return session.userId;
    else return -1;
}

function forEachSession(callback) {
    sessions.forEach(callback);
}

function destroy(sessionId) {
    const session = sessions.get(sessionId);
    if (session)
        sessions.delete(sessionId);
}

export default {
    create,
    isValid,
    getUserId,
    forEachSession,
    destroy
};
