"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const user_1 = require("../../models/user");
const event_1 = require("../../event");
module.exports = async (params, user) => new Promise(async (res, rej) => {
    // Get 'home' parameter
    const [home, homeErr] = cafy_1.default(params.home).optional.array().each(cafy_1.default().strict.object()
        .have('name', cafy_1.default().string())
        .have('id', cafy_1.default().string())
        .have('data', cafy_1.default().object())).$;
    if (homeErr)
        return rej('invalid home param');
    // Get 'id' parameter
    const [id, idErr] = cafy_1.default(params.id).optional.string().$;
    if (idErr)
        return rej('invalid id param');
    // Get 'data' parameter
    const [data, dataErr] = cafy_1.default(params.data).optional.object().$;
    if (dataErr)
        return rej('invalid data param');
    if (home) {
        await user_1.default.update(user._id, {
            $set: {
                'client_settings.mobile_home': home
            }
        });
        res();
        event_1.default(user._id, 'mobile_home_updated', {
            home
        });
    }
    else {
        if (id == null && data == null)
            return rej('you need to set id and data params if home param unset');
        const _home = user.client_settings.mobile_home || [];
        const widget = _home.find(w => w.id == id);
        if (widget == null)
            return rej('widget not found');
        widget.data = data;
        await user_1.default.update(user._id, {
            $set: {
                'client_settings.mobile_home': _home
            }
        });
        res();
        event_1.default(user._id, 'mobile_home_updated', {
            id, data
        });
    }
});
