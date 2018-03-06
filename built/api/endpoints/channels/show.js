"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const channel_1 = require("../../models/channel");
/**
 * Show a channel
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
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
    // Serialize
    res(await channel_1.pack(channel, user));
});
