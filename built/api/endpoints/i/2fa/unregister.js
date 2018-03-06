"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const bcrypt = require("bcryptjs");
const user_1 = require("../../../models/user");
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
    await user_1.default.update(user._id, {
        $set: {
            two_factor_secret: null,
            two_factor_enabled: false
        }
    });
    res();
});
