"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const user_1 = require("../models/user");
const mute_1 = require("../models/mute");
const post_1 = require("../models/post");
const read_notification_1 = require("../common/read-notification");
const log = debug('misskey');
async function default_1(request, connection, subscriber, user) {
    // Subscribe Home stream channel
    subscriber.subscribe(`misskey:user-stream:${user._id}`);
    const mute = await mute_1.default.find({
        muter_id: user._id,
        deleted_at: { $exists: false }
    });
    const mutedUserIds = mute.map(m => m.mutee_id.toString());
    subscriber.on('message', async (channel, data) => {
        switch (channel.split(':')[1]) {
            case 'user-stream':
                try {
                    const x = JSON.parse(data);
                    if (x.type == 'post') {
                        if (mutedUserIds.indexOf(x.body.user_id) != -1) {
                            return;
                        }
                        if (x.body.reply != null && mutedUserIds.indexOf(x.body.reply.user_id) != -1) {
                            return;
                        }
                        if (x.body.repost != null && mutedUserIds.indexOf(x.body.repost.user_id) != -1) {
                            return;
                        }
                    }
                    else if (x.type == 'notification') {
                        if (mutedUserIds.indexOf(x.body.user_id) != -1) {
                            return;
                        }
                    }
                    connection.send(data);
                }
                catch (e) {
                    connection.send(data);
                }
                break;
            case 'post-stream':
                const postId = channel.split(':')[2];
                log(`RECEIVED: ${postId} ${data} by @${user.username}`);
                const post = await post_1.pack(postId, user, {
                    detail: true
                });
                connection.send(JSON.stringify({
                    type: 'post-updated',
                    body: {
                        post: post
                    }
                }));
                break;
        }
    });
    connection.on('message', data => {
        const msg = JSON.parse(data.utf8Data);
        switch (msg.type) {
            case 'api':
                // TODO
                break;
            case 'alive':
                // Update lastUsedAt
                user_1.default.update({ _id: user._id }, {
                    $set: {
                        last_used_at: new Date()
                    }
                });
                break;
            case 'read_notification':
                if (!msg.id)
                    return;
                read_notification_1.default(user._id, msg.id);
                break;
            case 'capture':
                if (!msg.id)
                    return;
                const postId = msg.id;
                log(`CAPTURE: ${postId} by @${user.username}`);
                subscriber.subscribe(`misskey:post-stream:${postId}`);
                break;
        }
    });
}
exports.default = default_1;
