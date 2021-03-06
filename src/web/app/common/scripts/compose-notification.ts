import getPostSummary from '../../../../common/get-post-summary';
import getReactionEmoji from '../../../../common/get-reaction-emoji';

type Notification = {
	title: string;
	body: string;
	icon: string;
	onclick?: any;
};

// TODO: i18n

export default function(type, data): Notification {
	switch (type) {
		case 'drive_file_created':
			return {
				title: 'ファイルがアップロードされました',
				body: data.name,
				icon: data.url + '?thumbnail&size=64'
			};

		case 'mention':
			return {
				title: `${data.user.name}さんから:`,
				body: getPostSummary(data),
				icon: data.user.avatar_url + '?thumbnail&size=64'
			};

		case 'reply':
			return {
				title: `${data.user.name}さんから返信:`,
				body: getPostSummary(data),
				icon: data.user.avatar_url + '?thumbnail&size=64'
			};

		case 'quote':
			return {
				title: `${data.user.name}さんが引用:`,
				body: getPostSummary(data),
				icon: data.user.avatar_url + '?thumbnail&size=64'
			};

		case 'reaction':
			return {
				title: `${data.user.name}: ${getReactionEmoji(data.reaction)}:`,
				body: getPostSummary(data.post),
				icon: data.user.avatar_url + '?thumbnail&size=64'
			};

		case 'unread_messaging_message':
			return {
				title: `${data.user.name}さんからメッセージ:`,
				body: data.text, // TODO: getMessagingMessageSummary(data),
				icon: data.user.avatar_url + '?thumbnail&size=64'
			};

		case 'othello_invited':
			return {
				title: '対局への招待があります',
				body: `${data.parent.name}さんから`,
				icon: data.parent.avatar_url + '?thumbnail&size=64'
			};

		default:
			return null;
	}
}
