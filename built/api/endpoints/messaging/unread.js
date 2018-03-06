"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const messaging_message_1 = require("../../models/messaging-message");
const mute_1 = require("../../models/mute");
/**
 * Get count of unread messages
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
    const mute = await mute_1.default.find({
        muter_id: user._id,
        deleted_at: { $exists: false }
    });
    const mutedUserIds = mute.map(m => m.mutee_id);
    const count = await messaging_message_1.default
        .count({
        user_id: {
            $nin: mutedUserIds
        },
        recipient_id: user._id,
        is_read: false
    });
    res({
        count: count
    });
});
