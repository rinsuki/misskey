"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const channel_1 = require("../../models/channel");
const channel_watching_1 = require("../../models/channel-watching");
const channel_2 = require("../../models/channel");
/**
 * Create a channel
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
    // Get 'title' parameter
    const [title, titleErr] = cafy_1.default(params.title).string().range(1, 100).$;
    if (titleErr)
        return rej('invalid title param');
    // Create a channel
    const channel = await channel_1.default.insert({
        created_at: new Date(),
        user_id: user._id,
        title: title,
        index: 0,
        watching_count: 1
    });
    // Response
    res(await channel_2.pack(channel));
    // Create Watching
    await channel_watching_1.default.insert({
        created_at: new Date(),
        user_id: user._id,
        channel_id: channel._id
    });
});
