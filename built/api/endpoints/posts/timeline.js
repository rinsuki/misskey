"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const rap_1 = require("@prezzemolo/rap");
const post_1 = require("../../models/post");
const mute_1 = require("../../models/mute");
const channel_watching_1 = require("../../models/channel-watching");
const get_friends_1 = require("../../common/get-friends");
const post_2 = require("../../models/post");
/**
 * Get timeline of myself
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @return {Promise<any>}
 */
module.exports = async (params, user, app) => {
    // Get 'limit' parameter
    const [limit = 10, limitErr] = cafy_1.default(params.limit).optional.number().range(1, 100).$;
    if (limitErr)
        throw 'invalid limit param';
    // Get 'since_id' parameter
    const [sinceId, sinceIdErr] = cafy_1.default(params.since_id).optional.id().$;
    if (sinceIdErr)
        throw 'invalid since_id param';
    // Get 'until_id' parameter
    const [untilId, untilIdErr] = cafy_1.default(params.until_id).optional.id().$;
    if (untilIdErr)
        throw 'invalid until_id param';
    // Get 'since_date' parameter
    const [sinceDate, sinceDateErr] = cafy_1.default(params.since_date).optional.number().$;
    if (sinceDateErr)
        throw 'invalid since_date param';
    // Get 'until_date' parameter
    const [untilDate, untilDateErr] = cafy_1.default(params.until_date).optional.number().$;
    if (untilDateErr)
        throw 'invalid until_date param';
    // Check if only one of since_id, until_id, since_date, until_date specified
    if ([sinceId, untilId, sinceDate, untilDate].filter(x => x != null).length > 1) {
        throw 'only one of since_id, until_id, since_date, until_date can be specified';
    }
    const { followingIds, watchingChannelIds, mutedUserIds } = await rap_1.default({
        // ID list of the user itself and other users who the user follows
        followingIds: get_friends_1.default(user._id),
        // Watchしているチャンネルを取得
        watchingChannelIds: channel_watching_1.default.find({
            user_id: user._id,
            // 削除されたドキュメントは除く
            deleted_at: { $exists: false }
        }).then(watches => watches.map(w => w.channel_id)),
        // ミュートしているユーザーを取得
        mutedUserIds: mute_1.default.find({
            muter_id: user._id,
            // 削除されたドキュメントは除く
            deleted_at: { $exists: false }
        }).then(ms => ms.map(m => m.mutee_id))
    });
    //#region Construct query
    const sort = {
        _id: -1
    };
    const query = {
        $or: [{
                // フォローしている人のタイムラインへの投稿
                user_id: {
                    $in: followingIds
                },
                // 「タイムラインへの」投稿に限定するためにチャンネルが指定されていないもののみに限る
                $or: [{
                        channel_id: {
                            $exists: false
                        }
                    }, {
                        channel_id: null
                    }]
            }, {
                // Watchしているチャンネルへの投稿
                channel_id: {
                    $in: watchingChannelIds
                }
            }],
        // mute
        user_id: {
            $nin: mutedUserIds
        },
        '_reply.user_id': {
            $nin: mutedUserIds
        },
        '_repost.user_id': {
            $nin: mutedUserIds
        },
    };
    if (sinceId) {
        sort._id = 1;
        query._id = {
            $gt: sinceId
        };
    }
    else if (untilId) {
        query._id = {
            $lt: untilId
        };
    }
    else if (sinceDate) {
        sort._id = 1;
        query.created_at = {
            $gt: new Date(sinceDate)
        };
    }
    else if (untilDate) {
        query.created_at = {
            $lt: new Date(untilDate)
        };
    }
    //#endregion
    // Issue query
    const timeline = await post_1.default
        .find(query, {
        limit: limit,
        sort: sort
    });
    // Serialize
    return await Promise.all(timeline.map(post => post_2.pack(post, user)));
};
