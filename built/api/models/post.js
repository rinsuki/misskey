"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = require("mongodb");
const deepcopy = require("deepcopy");
const rap_1 = require("@prezzemolo/rap");
const mongodb_1 = require("../../db/mongodb");
const user_1 = require("./user");
const app_1 = require("./app");
const channel_1 = require("./channel");
const poll_vote_1 = require("./poll-vote");
const post_reaction_1 = require("./post-reaction");
const drive_file_1 = require("./drive-file");
const text_1 = require("../common/text");
const Post = mongodb_1.default.get('posts');
exports.default = Post;
function isValidText(text) {
    return text.length <= 1000 && text.trim() != '';
}
exports.isValidText = isValidText;
/**
 * Pack a post for API response
 *
 * @param post target
 * @param me? serializee
 * @param options? serialize options
 * @return response
 */
exports.pack = async (post, me, options) => {
    const opts = options || {
        detail: true,
    };
    // Me
    const meId = me
        ? mongo.ObjectID.prototype.isPrototypeOf(me)
            ? me
            : typeof me === 'string'
                ? new mongo.ObjectID(me)
                : me._id
        : null;
    let _post;
    // Populate the post if 'post' is ID
    if (mongo.ObjectID.prototype.isPrototypeOf(post)) {
        _post = await Post.findOne({
            _id: post
        });
    }
    else if (typeof post === 'string') {
        _post = await Post.findOne({
            _id: new mongo.ObjectID(post)
        });
    }
    else {
        _post = deepcopy(post);
    }
    if (!_post)
        throw 'invalid post arg.';
    const id = _post._id;
    // Rename _id to id
    _post.id = _post._id;
    delete _post._id;
    delete _post.mentions;
    // Parse text
    if (_post.text) {
        _post.ast = text_1.default(_post.text);
    }
    // Populate user
    _post.user = user_1.pack(_post.user_id, meId);
    // Populate app
    if (_post.app_id) {
        _post.app = app_1.pack(_post.app_id);
    }
    // Populate channel
    if (_post.channel_id) {
        _post.channel = channel_1.pack(_post.channel_id);
    }
    // Populate media
    if (_post.media_ids) {
        _post.media = Promise.all(_post.media_ids.map(fileId => drive_file_1.pack(fileId)));
    }
    // When requested a detailed post data
    if (opts.detail) {
        // Get previous post info
        _post.prev = (async () => {
            const prev = await Post.findOne({
                user_id: _post.user_id,
                _id: {
                    $lt: id
                }
            }, {
                fields: {
                    _id: true
                },
                sort: {
                    _id: -1
                }
            });
            return prev ? prev._id : null;
        })();
        // Get next post info
        _post.next = (async () => {
            const next = await Post.findOne({
                user_id: _post.user_id,
                _id: {
                    $gt: id
                }
            }, {
                fields: {
                    _id: true
                },
                sort: {
                    _id: 1
                }
            });
            return next ? next._id : null;
        })();
        if (_post.reply_id) {
            // Populate reply to post
            _post.reply = exports.pack(_post.reply_id, meId, {
                detail: false
            });
        }
        if (_post.repost_id) {
            // Populate repost
            _post.repost = exports.pack(_post.repost_id, meId, {
                detail: _post.text == null
            });
        }
        // Poll
        if (meId && _post.poll) {
            _post.poll = (async (poll) => {
                const vote = await poll_vote_1.default
                    .findOne({
                    user_id: meId,
                    post_id: id
                });
                if (vote != null) {
                    const myChoice = poll.choices
                        .filter(c => c.id == vote.choice)[0];
                    myChoice.is_voted = true;
                }
                return poll;
            })(_post.poll);
        }
        // Fetch my reaction
        if (meId) {
            _post.my_reaction = (async () => {
                const reaction = await post_reaction_1.default
                    .findOne({
                    user_id: meId,
                    post_id: id,
                    deleted_at: { $exists: false }
                });
                if (reaction) {
                    return reaction.reaction;
                }
                return null;
            })();
        }
    }
    // resolve promises in _post object
    _post = await rap_1.default(_post);
    return _post;
};
