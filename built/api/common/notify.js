"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notification_1 = require("../models/notification");
const mute_1 = require("../models/mute");
const event_1 = require("../event");
const notification_2 = require("../models/notification");
exports.default = (notifiee, notifier, type, content) => new Promise(async (resolve, reject) => {
    if (notifiee.equals(notifier)) {
        return resolve();
    }
    // Create notification
    const notification = await notification_1.default.insert(Object.assign({
        created_at: new Date(),
        notifiee_id: notifiee,
        notifier_id: notifier,
        type: type,
        is_read: false
    }, content));
    resolve(notification);
    // Publish notification event
    event_1.default(notifiee, 'notification', await notification_2.pack(notification));
    // 3秒経っても(今回作成した)通知が既読にならなかったら「未読の通知がありますよ」イベントを発行する
    setTimeout(async () => {
        const fresh = await notification_1.default.findOne({ _id: notification._id }, { is_read: true });
        if (!fresh.is_read) {
            //#region ただしミュートしているユーザーからの通知なら無視
            const mute = await mute_1.default.find({
                muter_id: notifiee,
                deleted_at: { $exists: false }
            });
            const mutedUserIds = mute.map(m => m.mutee_id.toString());
            if (mutedUserIds.indexOf(notifier.toString()) != -1) {
                return;
            }
            //#endregion
            event_1.default(notifiee, 'unread_notification', await notification_2.pack(notification));
        }
    }, 3000);
});
