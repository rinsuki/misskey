"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const push = require('web-push');
const mongo = require("mongodb");
const sw_subscription_1 = require("../models/sw-subscription");
const conf_1 = require("../../conf");
if (conf_1.default.sw) {
    // アプリケーションの連絡先と、サーバーサイドの鍵ペアの情報を登録
    push.setVapidDetails(conf_1.default.maintainer.url, conf_1.default.sw.public_key, conf_1.default.sw.private_key);
}
async function default_1(userId, type, body) {
    if (!conf_1.default.sw)
        return;
    if (typeof userId === 'string') {
        userId = new mongo.ObjectID(userId);
    }
    // Fetch
    const subscriptions = await sw_subscription_1.default.find({
        user_id: userId
    });
    subscriptions.forEach(subscription => {
        const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
                auth: subscription.auth,
                p256dh: subscription.publickey
            }
        };
        push.sendNotification(pushSubscription, JSON.stringify({
            type, body
        })).catch(err => {
            //console.log(err.statusCode);
            //console.log(err.headers);
            //console.log(err.body);
            if (err.statusCode == 410) {
                sw_subscription_1.default.remove({
                    user_id: userId,
                    endpoint: subscription.endpoint,
                    auth: subscription.auth,
                    publickey: subscription.publickey
                });
            }
        });
    });
}
exports.default = default_1;
