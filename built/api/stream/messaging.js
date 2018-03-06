"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const read_messaging_message_1 = require("../common/read-messaging-message");
function messagingStream(request, connection, subscriber, user) {
    const otherparty = request.resourceURL.query.otherparty;
    // Subscribe messaging stream
    subscriber.subscribe(`misskey:messaging-stream:${user._id}-${otherparty}`);
    subscriber.on('message', (_, data) => {
        connection.send(data);
    });
    connection.on('message', async (data) => {
        const msg = JSON.parse(data.utf8Data);
        switch (msg.type) {
            case 'read':
                if (!msg.id)
                    return;
                read_messaging_message_1.default(user._id, otherparty, msg.id);
                break;
        }
    });
}
exports.default = messagingStream;
