import move from "./move.mjs";
import interact from "./interact.mjs";
import reply from "./reply.mjs";
import location from "./location.mjs";
import { success } from "./responce.mjs";

const actions = {
    // Move the user
    move,
    
    // Interact with object
    interact,
    
    // Reply to dialog
    reply,
    
    // Change location
    location,
    
    // Return user data
    sync: async function(socket, user, payload) {
        success(socket, "sync", user);
    },
    
    // Validate session
    validate: async function(socket, user, payload) {
        success(socket, "validate", {});
    }
};

export default actions;
