"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const messaging_message_1 = require("../../models/messaging-message");
const user_1 = require("../../models/user");
const messaging_message_2 = require("../../models/messaging-message");
const read_messaging_message_1 = require("../../common/read-messaging-message");
/**
 * Get messages
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
    // Get 'user_id' parameter
    const [recipientId, recipientIdErr] = cafy_1.default(params.user_id).id().$;
    if (recipientIdErr)
        return rej('invalid user_id param');
    // Fetch recipient
    const recipient = await user_1.default.findOne({
        _id: recipientId
    }, {
        fields: {
            _id: true
        }
    });
    if (recipient === null) {
        return rej('user not found');
    }
    // Get 'mark_as_read' parameter
    const [markAsRead = true, markAsReadErr] = cafy_1.default(params.mark_as_read).optional.boolean().$;
    if (markAsReadErr)
        return rej('invalid mark_as_read param');
    // Get 'limit' parameter
    const [limit = 10, limitErr] = cafy_1.default(params.limit).optional.number().range(1, 100).$;
    if (limitErr)
        return rej('invalid limit param');
    // Get 'since_id' parameter
    const [sinceId, sinceIdErr] = cafy_1.default(params.since_id).optional.id().$;
    if (sinceIdErr)
        return rej('invalid since_id param');
    // Get 'until_id' parameter
    const [untilId, untilIdErr] = cafy_1.default(params.until_id).optional.id().$;
    if (untilIdErr)
        return rej('invalid until_id param');
    // Check if both of since_id and until_id is specified
    if (sinceId && untilId) {
        return rej('cannot set since_id and until_id');
    }
    const query = {
        $or: [{
                user_id: user._id,
                recipient_id: recipient._id
            }, {
                user_id: recipient._id,
                recipient_id: user._id
            }]
    };
    const sort = {
        _id: -1
    };
    if (sinceId) {
        sort._id = 1;
        query._id = {
            $gt: sinceId
        };
    }
    else if (untilId) {
        query._id = {
            $lt: untilId
        };
    }
    // Issue query
    const messages = await messaging_message_1.default
        .find(query, {
        limit: limit,
        sort: sort
    });
    // Serialize
    res(await Promise.all(messages.map(async (message) => await messaging_message_2.pack(message, user, {
        populateRecipient: false
    }))));
    if (messages.length === 0) {
        return;
    }
    // Mark as read all
    if (markAsRead) {
        read_messaging_message_1.default(user._id, recipient._id, messages);
    }
});
