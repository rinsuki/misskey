"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(request, connection, subscriber) {
    const channel = request.resourceURL.query.channel;
    // Subscribe channel stream
    subscriber.subscribe(`misskey:channel-stream:${channel}`);
    subscriber.on('message', (_, data) => {
        connection.send(data);
    });
}
exports.default = default_1;
