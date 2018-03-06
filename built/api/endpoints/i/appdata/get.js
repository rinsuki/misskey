"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const appdata_1 = require("../../../models/appdata");
/**
 * Get app data
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @param {Boolean} isSecure
 * @return {Promise<any>}
 */
module.exports = (params, user, app) => new Promise(async (res, rej) => {
    if (app == null)
        return rej('このAPIはサードパーティAppからのみ利用できます');
    // Get 'key' parameter
    const [key = null, keyError] = cafy_1.default(params.key).optional.nullable.string().match(/[a-z_]+/).$;
    if (keyError)
        return rej('invalid key param');
    const select = {};
    if (key !== null) {
        select[`data.${key}`] = true;
    }
    const appdata = await appdata_1.default.findOne({
        app_id: app._id,
        user_id: user._id
    }, {
        fields: select
    });
    if (appdata) {
        res(appdata.data);
    }
    else {
        res();
    }
});
