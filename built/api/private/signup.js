"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid");
const bcrypt = require("bcryptjs");
const recaptcha = require("recaptcha-promise");
const user_1 = require("../models/user");
const generate_native_user_token_1 = require("../common/generate-native-user-token");
const conf_1 = require("../../conf");
recaptcha.init({
    secret_key: conf_1.default.recaptcha.secret_key
});
const home = {
    left: [
        'profile',
        'calendar',
        'activity',
        'rss',
        'trends',
        'photo-stream',
        'version'
    ],
    right: [
        'broadcast',
        'notifications',
        'users',
        'polls',
        'server',
        'donation',
        'nav',
        'tips'
    ]
};
exports.default = async (req, res) => {
    // Verify recaptcha
    // ただしテスト時はこの機構は障害となるため無効にする
    if (process.env.NODE_ENV !== 'test') {
        const success = await recaptcha(req.body['g-recaptcha-response']);
        if (!success) {
            res.status(400).send('recaptcha-failed');
            return;
        }
    }
    const username = req.body['username'];
    const password = req.body['password'];
    const name = '名無し';
    // Validate username
    if (!user_1.validateUsername(username)) {
        res.sendStatus(400);
        return;
    }
    // Validate password
    if (!user_1.validatePassword(password)) {
        res.sendStatus(400);
        return;
    }
    // Fetch exist user that same username
    const usernameExist = await user_1.default
        .count({
        username_lower: username.toLowerCase()
    }, {
        limit: 1
    });
    // Check username already used
    if (usernameExist !== 0) {
        res.sendStatus(400);
        return;
    }
    // Generate hash of password
    const salt = await bcrypt.genSalt(8);
    const hash = await bcrypt.hash(password, salt);
    // Generate secret
    const secret = generate_native_user_token_1.default();
    //#region Construct home data
    const homeData = [];
    home.left.forEach(widget => {
        homeData.push({
            name: widget,
            id: uuid(),
            place: 'left',
            data: {}
        });
    });
    home.right.forEach(widget => {
        homeData.push({
            name: widget,
            id: uuid(),
            place: 'right',
            data: {}
        });
    });
    //#endregion
    // Create account
    const account = await user_1.default.insert({
        token: secret,
        avatar_id: null,
        banner_id: null,
        created_at: new Date(),
        description: null,
        email: null,
        followers_count: 0,
        following_count: 0,
        links: null,
        name: name,
        password: hash,
        posts_count: 0,
        likes_count: 0,
        liked_count: 0,
        drive_capacity: 1073741824,
        username: username,
        username_lower: username.toLowerCase(),
        profile: {
            bio: null,
            birthday: null,
            blood: null,
            gender: null,
            handedness: null,
            height: null,
            location: null,
            weight: null
        },
        settings: {
            auto_watch: true
        },
        client_settings: {
            home: homeData
        }
    });
    // Response
    res.send(await user_1.pack(account));
    // Create search index
    if (conf_1.default.elasticsearch.enable) {
        const es = require('../../db/elasticsearch');
        es.index({
            index: 'misskey',
            type: 'user',
            id: account._id.toString(),
            body: {
                username: username
            }
        });
    }
};
