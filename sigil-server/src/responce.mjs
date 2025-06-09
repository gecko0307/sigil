export function success(socket, action, payload) {
    socket.send(JSON.stringify({
        action,
        result: true,
        payload
    }));
}

export function failure(socket, action, message) {
    socket.send(JSON.stringify({
        action,
        result: false,
        message
    }));
}
