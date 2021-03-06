/**
 * Module dependencies
 */
import $ from 'cafy';
import Post from '../../models/post';

/**
 * Categorize a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	if (!user.is_pro) {
		return rej('This endpoint is available only from a Pro account');
	}

	// Get 'post_id' parameter
	const [postId, postIdErr] = $(params.post_id).id().$;
	if (postIdErr) return rej('invalid post_id param');

	// Get categorizee
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	if (post.is_category_verified) {
		return rej('This post already has the verified category');
	}

	// Get 'category' parameter
	const [category, categoryErr] = $(params.category).string().or([
		'music', 'game', 'anime', 'it', 'gadgets', 'photography'
	]).$;
	if (categoryErr) return rej('invalid category param');

	// Set category
	Post.update({ _id: post._id }, {
		$set: {
			category: category,
			is_category_verified: true
		}
	});

	// Send response
	res();
});
