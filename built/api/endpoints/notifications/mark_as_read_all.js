"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const notification_1 = require("../../models/notification");
const event_1 = require("../../event");
/**
 * Mark as read all notifications
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
    // Update documents
    await notification_1.default.update({
        notifiee_id: user._id,
        is_read: false
    }, {
        $set: {
            is_read: true
        }
    }, {
        multi: true
    });
    // Response
    res();
    // 全ての通知を読みましたよというイベントを発行
    event_1.default(user._id, 'read_all_notifications');
});
