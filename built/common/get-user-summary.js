"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ユーザーを表す文字列を取得します。
 * @param user ユーザー
 */
function default_1(user) {
    return `${user.name} (@${user.username})\n` +
        `${user.posts_count}投稿、${user.following_count}フォロー、${user.followers_count}フォロワー\n` +
        `場所: ${user.profile.location}、誕生日: ${user.profile.birthday}\n` +
        `「${user.description}」`;
}
exports.default = default_1;
