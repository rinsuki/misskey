"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const user_1 = require("../../models/user");
const post_1 = require("../../models/post");
const user_2 = require("../../models/user");
/**
 * Pin post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
    // Get 'post_id' parameter
    const [postId, postIdErr] = cafy_1.default(params.post_id).id().$;
    if (postIdErr)
        return rej('invalid post_id param');
    // Fetch pinee
    const post = await post_1.default.findOne({
        _id: postId,
        user_id: user._id
    });
    if (post === null) {
        return rej('post not found');
    }
    await user_1.default.update(user._id, {
        $set: {
            pinned_post_id: post._id
        }
    });
    // Serialize
    const iObj = await user_2.pack(user, user, {
        detail: true
    });
    // Send response
    res(iObj);
});
