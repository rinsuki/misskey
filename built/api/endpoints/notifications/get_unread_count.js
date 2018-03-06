"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const notification_1 = require("../../models/notification");
const mute_1 = require("../../models/mute");
/**
 * Get count of unread notifications
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
    const count = await notification_1.default
        .count({
        notifiee_id: user._id,
        notifier_id: {
            $nin: mutedUserIds
        },
        is_read: false
    });
    res({
        count: count
    });
});
