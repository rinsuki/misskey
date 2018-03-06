"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(request, connection, subscriber, user) {
    // Subscribe messaging index stream
    subscriber.subscribe(`misskey:messaging-index-stream:${user._id}`);
    subscriber.on('message', (_, data) => {
        connection.send(data);
    });
}
exports.default = default_1;
