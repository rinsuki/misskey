"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = require("mongodb");
const messaging_message_1 = require("../models/messaging-message");
const event_1 = require("../event");
const event_2 = require("../event");
const event_3 = require("../event");
/**
 * Mark as read message(s)
 */
exports.default = (user, otherparty, message) => new Promise(async (resolve, reject) => {
    const userId = mongo.ObjectID.prototype.isPrototypeOf(user)
        ? user
        : new mongo.ObjectID(user);
    const otherpartyId = mongo.ObjectID.prototype.isPrototypeOf(otherparty)
        ? otherparty
        : new mongo.ObjectID(otherparty);
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
    await messaging_message_1.default.update({
        _id: { $in: ids },
        user_id: otherpartyId,
        recipient_id: userId,
        is_read: false
    }, {
        $set: {
            is_read: true
        }
    }, {
        multi: true
    });
    // Publish event
    event_2.publishMessagingStream(otherpartyId, userId, 'read', ids.map(id => id.toString()));
    event_3.publishMessagingIndexStream(userId, 'read', ids.map(id => id.toString()));
    // Calc count of my unread messages
    const count = await messaging_message_1.default
        .count({
        recipient_id: userId,
        is_read: false
    });
    if (count == 0) {
        // 全ての(いままで未読だった)自分宛てのメッセージを(これで)読みましたよというイベントを発行
        event_1.default(userId, 'read_all_messaging_messages');
    }
});
