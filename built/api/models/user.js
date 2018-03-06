"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = require("mongodb");
const deepcopy = require("deepcopy");
const rap_1 = require("@prezzemolo/rap");
const mongodb_1 = require("../../db/mongodb");
const post_1 = require("./post");
const following_1 = require("./following");
const mute_1 = require("./mute");
const get_friends_1 = require("../common/get-friends");
const conf_1 = require("../../conf");
const User = mongodb_1.default.get('users');
User.createIndex('username');
User.createIndex('token');
exports.default = User;
function validateUsername(username) {
    return typeof username == 'string' && /^[a-zA-Z0-9\-]{3,20}$/.test(username);
}
exports.validateUsername = validateUsername;
function validatePassword(password) {
    return typeof password == 'string' && password != '';
}
exports.validatePassword = validatePassword;
function isValidName(name) {
    return typeof name == 'string' && name.length < 30 && name.trim() != '';
}
exports.isValidName = isValidName;
function isValidDescription(description) {
    return typeof description == 'string' && description.length < 500 && description.trim() != '';
}
exports.isValidDescription = isValidDescription;
function isValidLocation(location) {
    return typeof location == 'string' && location.length < 50 && location.trim() != '';
}
exports.isValidLocation = isValidLocation;
function isValidBirthday(birthday) {
    return typeof birthday == 'string' && /^([0-9]{4})\-([0-9]{2})-([0-9]{2})$/.test(birthday);
}
exports.isValidBirthday = isValidBirthday;
function init(user) {
    user._id = new mongo.ObjectID(user._id);
    user.avatar_id = new mongo.ObjectID(user.avatar_id);
    user.banner_id = new mongo.ObjectID(user.banner_id);
    user.pinned_post_id = new mongo.ObjectID(user.pinned_post_id);
    return user;
}
exports.init = init;
/**
 * Pack a user for API response
 *
 * @param user target
 * @param me? serializee
 * @param options? serialize options
 * @return Packed user
 */
exports.pack = (user, me, options) => new Promise(async (resolve, reject) => {
    const opts = Object.assign({
        detail: false,
        includeSecrets: false
    }, options);
    let _user;
    const fields = opts.detail ? {} : {
        settings: false,
        client_settings: false,
        profile: false,
        keywords: false,
        domains: false
    };
    // Populate the user if 'user' is ID
    if (mongo.ObjectID.prototype.isPrototypeOf(user)) {
        _user = await User.findOne({
            _id: user
        }, { fields });
    }
    else if (typeof user === 'string') {
        _user = await User.findOne({
            _id: new mongo.ObjectID(user)
        }, { fields });
    }
    else {
        _user = deepcopy(user);
    }
    if (!_user)
        return reject('invalid user arg.');
    // Me
    const meId = me
        ? mongo.ObjectID.prototype.isPrototypeOf(me)
            ? me
            : typeof me === 'string'
                ? new mongo.ObjectID(me)
                : me._id
        : null;
    // Rename _id to id
    _user.id = _user._id;
    delete _user._id;
    // Remove needless properties
    delete _user.latest_post;
    // Remove private properties
    delete _user.password;
    delete _user.token;
    delete _user.two_factor_temp_secret;
    delete _user.two_factor_secret;
    delete _user.username_lower;
    if (_user.twitter) {
        delete _user.twitter.access_token;
        delete _user.twitter.access_token_secret;
    }
    delete _user.line;
    // Visible via only the official client
    if (!opts.includeSecrets) {
        delete _user.email;
        delete _user.settings;
        delete _user.client_settings;
    }
    if (!opts.detail) {
        delete _user.two_factor_enabled;
    }
    _user.avatar_url = _user.avatar_id != null
        ? `${conf_1.default.drive_url}/${_user.avatar_id}`
        : `${conf_1.default.drive_url}/default-avatar.jpg`;
    _user.banner_url = _user.banner_id != null
        ? `${conf_1.default.drive_url}/${_user.banner_id}`
        : null;
    if (!meId || !meId.equals(_user.id) || !opts.detail) {
        delete _user.avatar_id;
        delete _user.banner_id;
        delete _user.drive_capacity;
    }
    if (meId && !meId.equals(_user.id)) {
        // Whether the user is following
        _user.is_following = (async () => {
            const follow = await following_1.default.findOne({
                follower_id: meId,
                followee_id: _user.id,
                deleted_at: { $exists: false }
            });
            return follow !== null;
        })();
        // Whether the user is followed
        _user.is_followed = (async () => {
            const follow2 = await following_1.default.findOne({
                follower_id: _user.id,
                followee_id: meId,
                deleted_at: { $exists: false }
            });
            return follow2 !== null;
        })();
        // Whether the user is muted
        _user.is_muted = (async () => {
            const mute = await mute_1.default.findOne({
                muter_id: meId,
                mutee_id: _user.id,
                deleted_at: { $exists: false }
            });
            return mute !== null;
        })();
    }
    if (opts.detail) {
        if (_user.pinned_post_id) {
            // Populate pinned post
            _user.pinned_post = post_1.pack(_user.pinned_post_id, meId, {
                detail: true
            });
        }
        if (meId && !meId.equals(_user.id)) {
            const myFollowingIds = await get_friends_1.default(meId);
            // Get following you know count
            _user.following_you_know_count = following_1.default.count({
                followee_id: { $in: myFollowingIds },
                follower_id: _user.id,
                deleted_at: { $exists: false }
            });
            // Get followers you know count
            _user.followers_you_know_count = following_1.default.count({
                followee_id: _user.id,
                follower_id: { $in: myFollowingIds },
                deleted_at: { $exists: false }
            });
        }
    }
    // resolve promises in _user object
    _user = await rap_1.default(_user);
    resolve(_user);
});
/*
function img(url) {
    return {
        thumbnail: {
            large: `${url}`,
            medium: '',
            small: ''
        }
    };
}
*/
