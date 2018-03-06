"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_post_summary_1 = require("./get-post-summary");
const get_reaction_emoji_1 = require("./get-reaction-emoji");
/**
 * 通知を表す文字列を取得します。
 * @param notification 通知
 */
function default_1(notification) {
    switch (notification.type) {
        case 'follow':
            return `${notification.user.name}にフォローされました`;
        case 'mention':
            return `言及されました:\n${notification.user.name}「${get_post_summary_1.default(notification.post)}」`;
        case 'reply':
            return `返信されました:\n${notification.user.name}「${get_post_summary_1.default(notification.post)}」`;
        case 'repost':
            return `Repostされました:\n${notification.user.name}「${get_post_summary_1.default(notification.post)}」`;
        case 'quote':
            return `引用されました:\n${notification.user.name}「${get_post_summary_1.default(notification.post)}」`;
        case 'reaction':
            return `リアクションされました:\n${notification.user.name} <${get_reaction_emoji_1.default(notification.reaction)}>「${get_post_summary_1.default(notification.post)}」`;
        case 'poll_vote':
            return `投票されました:\n${notification.user.name}「${get_post_summary_1.default(notification.post)}」`;
        default:
            return `<不明な通知タイプ: ${notification.type}>`;
    }
}
exports.default = default_1;
