"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const sw_subscription_1 = require("../../models/sw-subscription");
/**
 * subscribe service worker
 *
 * @param {any} params
 * @param {any} user
 * @param {any} _
 * @param {boolean} isSecure
 * @return {Promise<any>}
 */
module.exports = async (params, user, _, isSecure) => new Promise(async (res, rej) => {
    // Get 'endpoint' parameter
    const [endpoint, endpointErr] = cafy_1.default(params.endpoint).string().$;
    if (endpointErr)
        return rej('invalid endpoint param');
    // Get 'auth' parameter
    const [auth, authErr] = cafy_1.default(params.auth).string().$;
    if (authErr)
        return rej('invalid auth param');
    // Get 'publickey' parameter
    const [publickey, publickeyErr] = cafy_1.default(params.publickey).string().$;
    if (publickeyErr)
        return rej('invalid publickey param');
    // if already subscribed
    const exist = await sw_subscription_1.default.findOne({
        user_id: user._id,
        endpoint: endpoint,
        auth: auth,
        publickey: publickey,
        deleted_at: { $exists: false }
    });
    if (exist !== null) {
        return res();
    }
    await sw_subscription_1.default.insert({
        user_id: user._id,
        endpoint: endpoint,
        auth: auth,
        publickey: publickey
    });
    res();
});
