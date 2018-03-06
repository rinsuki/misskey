"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const post_1 = require("../../models/post");
/**
 * Categorize a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
    if (!user.is_pro) {
        return rej('This endpoint is available only from a Pro account');
    }
    // Get 'post_id' parameter
    const [postId, postIdErr] = cafy_1.default(params.post_id).id().$;
    if (postIdErr)
        return rej('invalid post_id param');
    // Get categorizee
    const post = await post_1.default.findOne({
        _id: postId
    });
    if (post === null) {
        return rej('post not found');
    }
    if (post.is_category_verified) {
        return rej('This post already has the verified category');
    }
    // Get 'category' parameter
    const [category, categoryErr] = cafy_1.default(params.category).string().or([
        'music', 'game', 'anime', 'it', 'gadgets', 'photography'
    ]).$;
    if (categoryErr)
        return rej('invalid category param');
    // Set category
    post_1.default.update({ _id: post._id }, {
        $set: {
            category: category,
            is_category_verified: true
        }
    });
    // Send response
    res();
});
