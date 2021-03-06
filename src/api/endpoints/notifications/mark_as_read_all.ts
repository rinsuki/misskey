/**
 * Module dependencies
 */
import Notification from '../../models/notification';
import event from '../../event';

/**
 * Mark as read all notifications
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Update documents
	await Notification.update({
		notifiee_id: user._id,
		is_read: false
	}, {
		$set: {
			is_read: true
		}
	}, {
		multi: true
	});

	// Response
	res();

	// 全ての通知を読みましたよというイベントを発行
	event(user._id, 'read_all_notifications');
});
