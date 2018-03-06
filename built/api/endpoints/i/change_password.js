"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const bcrypt = require("bcryptjs");
const user_1 = require("../../models/user");
/**
 * Change password
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
    // Get 'current_password' parameter
    const [currentPassword, currentPasswordErr] = cafy_1.default(params.current_password).string().$;
    if (currentPasswordErr)
        return rej('invalid current_password param');
    // Get 'new_password' parameter
    const [newPassword, newPasswordErr] = cafy_1.default(params.new_password).string().$;
    if (newPasswordErr)
        return rej('invalid new_password param');
    // Compare password
    const same = await bcrypt.compare(currentPassword, user.password);
    if (!same) {
        return rej('incorrect password');
    }
    // Generate hash of password
    const salt = await bcrypt.genSalt(8);
    const hash = await bcrypt.hash(newPassword, salt);
    await user_1.default.update(user._id, {
        $set: {
            password: hash
        }
    });
    res();
});
