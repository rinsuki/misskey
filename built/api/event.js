"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const push_sw_1 = require("./common/push-sw");
const conf_1 = require("../conf");
class MisskeyEvent {
    constructor() {
        // Connect to Redis
        this.redisClient = redis.createClient(conf_1.default.redis.port, conf_1.default.redis.host);
    }
    publishUserStream(userId, type, value) {
        this.publish(`user-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
    }
    publishSw(userId, type, value) {
        push_sw_1.default(userId, type, value);
    }
    publishDriveStream(userId, type, value) {
        this.publish(`drive-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
    }
    publishPostStream(postId, type, value) {
        this.publish(`post-stream:${postId}`, type, typeof value === 'undefined' ? null : value);
    }
    publishMessagingStream(userId, otherpartyId, type, value) {
        this.publish(`messaging-stream:${userId}-${otherpartyId}`, type, typeof value === 'undefined' ? null : value);
    }
    publishMessagingIndexStream(userId, type, value) {
        this.publish(`messaging-index-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
    }
    publishChannelStream(channelId, type, value) {
        this.publish(`channel-stream:${channelId}`, type, typeof value === 'undefined' ? null : value);
    }
    publish(channel, type, value) {
        const message = value == null ?
            { type: type } :
            { type: type, body: value };
        this.redisClient.publish(`misskey:${channel}`, JSON.stringify(message));
    }
}
const ev = new MisskeyEvent();
exports.default = ev.publishUserStream.bind(ev);
exports.pushSw = ev.publishSw.bind(ev);
exports.publishDriveStream = ev.publishDriveStream.bind(ev);
exports.publishPostStream = ev.publishPostStream.bind(ev);
exports.publishMessagingStream = ev.publishMessagingStream.bind(ev);
exports.publishMessagingIndexStream = ev.publishMessagingIndexStream.bind(ev);
exports.publishChannelStream = ev.publishChannelStream.bind(ev);
