"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const bcrypt = require("bcryptjs");
const user_1 = require("../../models/user");
const event_1 = require("../../event");
const generate_native_user_token_1 = require("../../common/generate-native-user-token");
/**
 * Regenerate native token
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
    // Get 'password' parameter
    const [password, passwordErr] = cafy_1.default(params.password).string().$;
    if (passwordErr)
        return rej('invalid password param');
    // Compare password
    const same = await bcrypt.compare(password, user.password);
    if (!same) {
        return rej('incorrect password');
    }
    // Generate secret
    const secret = generate_native_user_token_1.default();
    await user_1.default.update(user._id, {
        $set: {
            token: secret
        }
    });
    res();
    // Publish event
    event_1.default(user._id, 'my_token_regenerated');
});
