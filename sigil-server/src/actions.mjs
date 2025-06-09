import move from "./move.mjs";
import interact from "./interact.mjs";
import location from "./location.mjs";
import { success } from "./responce.mjs";

const actions = {
    move, interact, location,
    sync: async function(socket, user, payload) {
        success(socket, "sync", user);
    },
    validate: async function(socket, user, payload) {
        success(socket, "validate", {});
    }
};

export default actions;
