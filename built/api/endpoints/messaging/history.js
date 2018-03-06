"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const messaging_history_1 = require("../../models/messaging-history");
const mute_1 = require("../../models/mute");
const messaging_message_1 = require("../../models/messaging-message");
/**
 * Show messaging history
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
    // Get 'limit' parameter
    const [limit = 10, limitErr] = cafy_1.default(params.limit).optional.number().range(1, 100).$;
    if (limitErr)
        return rej('invalid limit param');
    const mute = await mute_1.default.find({
        muter_id: user._id,
        deleted_at: { $exists: false }
    });
    // Get history
    const history = await messaging_history_1.default
        .find({
        user_id: user._id,
        partner: {
            $nin: mute.map(m => m.mutee_id)
        }
    }, {
        limit: limit,
        sort: {
            updated_at: -1
        }
    });
    // Serialize
    res(await Promise.all(history.map(async (h) => await messaging_message_1.pack(h.message, user))));
});
