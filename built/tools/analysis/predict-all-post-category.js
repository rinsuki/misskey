"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const post_1 = require("../../api/models/post");
const core_1 = require("./core");
const c = new core_1.default();
c.init().then(() => {
    // 全ての(人間によって証明されていない)投稿を取得
    post_1.default.find({
        text: {
            $exists: true
        },
        is_category_verified: {
            $ne: true
        }
    }, {
        sort: {
            _id: -1
        },
        fields: {
            _id: true,
            text: true
        }
    }).then(posts => {
        posts.forEach(post => {
            console.log(`predicting... ${post._id}`);
            const category = c.predict(post.text);
            post_1.default.update({ _id: post._id }, {
                $set: {
                    category: category
                }
            });
        });
    });
});
