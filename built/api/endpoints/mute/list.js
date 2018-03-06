"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const mute_1 = require("../../models/mute");
const user_1 = require("../../models/user");
const get_friends_1 = require("../../common/get-friends");
/**
 * Get muted users of a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
    // Get 'iknow' parameter
    const [iknow = false, iknowErr] = cafy_1.default(params.iknow).optional.boolean().$;
    if (iknowErr)
        return rej('invalid iknow param');
    // Get 'limit' parameter
    const [limit = 30, limitErr] = cafy_1.default(params.limit).optional.number().range(1, 100).$;
    if (limitErr)
        return rej('invalid limit param');
    // Get 'cursor' parameter
    const [cursor = null, cursorErr] = cafy_1.default(params.cursor).optional.id().$;
    if (cursorErr)
        return rej('invalid cursor param');
    // Construct query
    const query = {
        muter_id: me._id,
        deleted_at: { $exists: false }
    };
    if (iknow) {
        // Get my friends
        const myFriends = await get_friends_1.default(me._id);
        query.mutee_id = {
            $in: myFriends
        };
    }
    // カーソルが指定されている場合
    if (cursor) {
        query._id = {
            $lt: cursor
        };
    }
    // Get mutes
    const mutes = await mute_1.default
        .find(query, {
        limit: limit + 1,
        sort: { _id: -1 }
    });
    // 「次のページ」があるかどうか
    const inStock = mutes.length === limit + 1;
    if (inStock) {
        mutes.pop();
    }
    // Serialize
    const users = await Promise.all(mutes.map(async (m) => await user_1.pack(m.mutee_id, me, { detail: true })));
    // Response
    res({
        users: users,
        next: inStock ? mutes[mutes.length - 1]._id : null,
    });
});
