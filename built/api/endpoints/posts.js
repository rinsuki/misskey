"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const post_1 = require("../models/post");
/**
 * Lists all posts
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = (params) => new Promise(async (res, rej) => {
    // Get 'reply' parameter
    const [reply, replyErr] = cafy_1.default(params.reply).optional.boolean().$;
    if (replyErr)
        return rej('invalid reply param');
    // Get 'repost' parameter
    const [repost, repostErr] = cafy_1.default(params.repost).optional.boolean().$;
    if (repostErr)
        return rej('invalid repost param');
    // Get 'media' parameter
    const [media, mediaErr] = cafy_1.default(params.media).optional.boolean().$;
    if (mediaErr)
        return rej('invalid media param');
    // Get 'poll' parameter
    const [poll, pollErr] = cafy_1.default(params.poll).optional.boolean().$;
    if (pollErr)
        return rej('invalid poll param');
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
    // Construct query
    const sort = {
        _id: -1
    };
    const query = {};
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
    if (reply != undefined) {
        query.reply_id = reply ? { $exists: true, $ne: null } : null;
    }
    if (repost != undefined) {
        query.repost_id = repost ? { $exists: true, $ne: null } : null;
    }
    if (media != undefined) {
        query.media_ids = media ? { $exists: true, $ne: null } : null;
    }
    if (poll != undefined) {
        query.poll = poll ? { $exists: true, $ne: null } : null;
    }
    // Issue query
    const posts = await post_1.default
        .find(query, {
        limit: limit,
        sort: sort
    });
    // Serialize
    res(await Promise.all(posts.map(async (post) => await post_1.pack(post))));
});
