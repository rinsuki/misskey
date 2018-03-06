"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const post_watching_1 = require("../models/post-watching");
exports.default = async (me, post) => {
    // 自分の投稿はwatchできない
    if (me.equals(post.user_id)) {
        return;
    }
    // if watching now
    const exist = await post_watching_1.default.findOne({
        post_id: post._id,
        user_id: me,
        deleted_at: { $exists: false }
    });
    if (exist !== null) {
        return;
    }
    await post_watching_1.default.insert({
        created_at: new Date(),
        post_id: post._id,
        user_id: me
    });
};
