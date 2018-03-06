"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = require("mongodb");
const deepcopy = require("deepcopy");
const channel_watching_1 = require("./channel-watching");
const mongodb_1 = require("../../db/mongodb");
const Channel = mongodb_1.default.get('channels');
exports.default = Channel;
/**
 * Pack a channel for API response
 *
 * @param channel target
 * @param me? serializee
 * @return response
 */
exports.pack = (channel, me) => new Promise(async (resolve, reject) => {
    let _channel;
    // Populate the channel if 'channel' is ID
    if (mongo.ObjectID.prototype.isPrototypeOf(channel)) {
        _channel = await Channel.findOne({
            _id: channel
        });
    }
    else if (typeof channel === 'string') {
        _channel = await Channel.findOne({
            _id: new mongo.ObjectID(channel)
        });
    }
    else {
        _channel = deepcopy(channel);
    }
    // Rename _id to id
    _channel.id = _channel._id;
    delete _channel._id;
    // Remove needless properties
    delete _channel.user_id;
    // Me
    const meId = me
        ? mongo.ObjectID.prototype.isPrototypeOf(me)
            ? me
            : typeof me === 'string'
                ? new mongo.ObjectID(me)
                : me._id
        : null;
    if (me) {
        //#region Watchしているかどうか
        const watch = await channel_watching_1.default.findOne({
            user_id: meId,
            channel_id: _channel.id,
            deleted_at: { $exists: false }
        });
        _channel.is_watching = watch !== null;
        //#endregion
    }
    resolve(_channel);
});
