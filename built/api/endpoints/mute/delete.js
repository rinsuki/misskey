"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const user_1 = require("../../models/user");
const mute_1 = require("../../models/mute");
/**
 * Unmute a user
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
    const muter = user;
    // Get 'user_id' parameter
    const [userId, userIdErr] = cafy_1.default(params.user_id).id().$;
    if (userIdErr)
        return rej('invalid user_id param');
    // Check if the mutee is yourself
    if (user._id.equals(userId)) {
        return rej('mutee is yourself');
    }
    // Get mutee
    const mutee = await user_1.default.findOne({
        _id: userId
    }, {
        fields: {
            data: false,
            profile: false
        }
    });
    if (mutee === null) {
        return rej('user not found');
    }
    // Check not muting
    const exist = await mute_1.default.findOne({
        muter_id: muter._id,
        mutee_id: mutee._id,
        deleted_at: { $exists: false }
    });
    if (exist === null) {
        return rej('already not muting');
    }
    // Delete mute
    await mute_1.default.update({
        _id: exist._id
    }, {
        $set: {
            deleted_at: new Date()
        }
    });
    // Send response
    res();
});
