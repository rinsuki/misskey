"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const user_1 = require("../../models/user");
const event_1 = require("../../event");
/**
 * Update myself
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
    // Get 'name' parameter
    const [name, nameErr] = cafy_1.default(params.name).string().$;
    if (nameErr)
        return rej('invalid name param');
    // Get 'value' parameter
    const [value, valueErr] = cafy_1.default(params.value).nullable.any().$;
    if (valueErr)
        return rej('invalid value param');
    const x = {};
    x[`client_settings.${name}`] = value;
    await user_1.default.update(user._id, {
        $set: x
    });
    // Serialize
    user.client_settings[name] = value;
    const iObj = await user_1.pack(user, user, {
        detail: true,
        includeSecrets: true
    });
    // Send response
    res(iObj);
    // Publish i updated event
    event_1.default(user._id, 'i_updated', iObj);
});
