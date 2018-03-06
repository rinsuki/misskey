"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = require("mongodb");
const notification_1 = require("../models/notification");
const event_1 = require("../event");
/**
 * Mark as read notification(s)
 */
exports.default = (user, message) => new Promise(async (resolve, reject) => {
    const userId = mongo.ObjectID.prototype.isPrototypeOf(user)
        ? user
        : new mongo.ObjectID(user);
    const ids = Array.isArray(message)
        ? mongo.ObjectID.prototype.isPrototypeOf(message[0])
            ? message
            : typeof message[0] === 'string'
                ? message.map(m => new mongo.ObjectID(m))
                : message.map(m => m._id)
        : mongo.ObjectID.prototype.isPrototypeOf(message)
            ? [message]
            : typeof message === 'string'
                ? [new mongo.ObjectID(message)]
                : [message._id];
    // Update documents
    await notification_1.default.update({
        _id: { $in: ids },
        is_read: false
    }, {
        $set: {
            is_read: true
        }
    }, {
        multi: true
    });
    // Calc count of my unread notifications
    const count = await notification_1.default
        .count({
        notifiee_id: userId,
        is_read: false
    });
    if (count == 0) {
        // 全ての(いままで未読だった)通知を(これで)読みましたよというイベントを発行
        event_1.default(userId, 'read_all_notifications');
    }
});
