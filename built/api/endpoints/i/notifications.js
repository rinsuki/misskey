"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const notification_1 = require("../../models/notification");
const mute_1 = require("../../models/mute");
const notification_2 = require("../../models/notification");
const get_friends_1 = require("../../common/get-friends");
const read_notification_1 = require("../../common/read-notification");
/**
 * Get notifications
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
    // Get 'following' parameter
    const [following = false, followingError] = cafy_1.default(params.following).optional.boolean().$;
    if (followingError)
        return rej('invalid following param');
    // Get 'mark_as_read' parameter
    const [markAsRead = true, markAsReadErr] = cafy_1.default(params.mark_as_read).optional.boolean().$;
    if (markAsReadErr)
        return rej('invalid mark_as_read param');
    // Get 'type' parameter
    const [type, typeErr] = cafy_1.default(params.type).optional.array('string').unique().$;
    if (typeErr)
        return rej('invalid type param');
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
    const mute = await mute_1.default.find({
        muter_id: user._id,
        deleted_at: { $exists: false }
    });
    const query = {
        notifiee_id: user._id,
        $and: [{
                notifier_id: {
                    $nin: mute.map(m => m.mutee_id)
                }
            }]
    };
    const sort = {
        _id: -1
    };
    if (following) {
        // ID list of the user itself and other users who the user follows
        const followingIds = await get_friends_1.default(user._id);
        query.$and.push({
            notifier_id: {
                $in: followingIds
            }
        });
    }
    if (type) {
        query.type = {
            $in: type
        };
    }
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
    const notifications = await notification_1.default
        .find(query, {
        limit: limit,
        sort: sort
    });
    // Serialize
    res(await Promise.all(notifications.map(async (notification) => await notification_2.pack(notification))));
    // Mark as read all
    if (notifications.length > 0 && markAsRead) {
        read_notification_1.default(user._id, notifications);
    }
});
