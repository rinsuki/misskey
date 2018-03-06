"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const user_1 = require("../models/user");
/**
 * Show myself
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @param {Boolean} isSecure
 * @return {Promise<any>}
 */
module.exports = (params, user, _, isSecure) => new Promise(async (res, rej) => {
    // Serialize
    res(await user_1.pack(user, user, {
        detail: true,
        includeSecrets: isSecure
    }));
    // Update lastUsedAt
    user_1.default.update({ _id: user._id }, {
        $set: {
            last_used_at: new Date()
        }
    });
});
