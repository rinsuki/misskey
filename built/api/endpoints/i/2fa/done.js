"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const speakeasy = require("speakeasy");
const user_1 = require("../../../models/user");
module.exports = async (params, user) => new Promise(async (res, rej) => {
    // Get 'token' parameter
    const [token, tokenErr] = cafy_1.default(params.token).string().$;
    if (tokenErr)
        return rej('invalid token param');
    const _token = token.replace(/\s/g, '');
    if (user.two_factor_temp_secret == null) {
        return rej('二段階認証の設定が開始されていません');
    }
    const verified = speakeasy.totp.verify({
        secret: user.two_factor_temp_secret,
        encoding: 'base32',
        token: _token
    });
    if (!verified) {
        return rej('not verified');
    }
    await user_1.default.update(user._id, {
        $set: {
            two_factor_secret: user.two_factor_temp_secret,
            two_factor_enabled: true
        }
    });
    res();
});
