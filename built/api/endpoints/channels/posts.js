"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const channel_1 = require("../../models/channel");
const post_1 = require("../../models/post");
/**
 * Show a posts of a channel
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
    // Get 'limit' parameter
    const [limit = 1000, limitErr] = cafy_1.default(params.limit).optional.number().range(1, 1000).$;
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
    // Get 'channel_id' parameter
    const [channelId, channelIdErr] = cafy_1.default(params.channel_id).id().$;
    if (channelIdErr)
        return rej('invalid channel_id param');
    // Fetch channel
    const channel = await channel_1.default.findOne({
        _id: channelId
    });
    if (channel === null) {
        return rej('channel not found');
    }
    //#region Construct query
    const sort = {
        _id: -1
    };
    const query = {
        channel_id: channel._id
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
    //#endregion Construct query
    // Issue query
    const posts = await post_1.default
        .find(query, {
        limit: limit,
        sort: sort
    });
    // Serialize
    res(await Promise.all(posts.map(async (post) => await post_1.pack(post, user))));
});
