"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cookie = require("cookie");
const uuid = require("uuid");
// import * as Twitter from 'twitter';
// const Twitter = require('twitter');
const autwh_1 = require("autwh");
const redis_1 = require("../../db/redis");
const user_1 = require("../models/user");
const event_1 = require("../event");
const conf_1 = require("../../conf");
const signin_1 = require("../common/signin");
module.exports = (app) => {
    function getUserToken(req) {
        // req.headers['cookie'] は常に string ですが、型定義の都合上
        // string | string[] になっているので string を明示しています
        return ((req.headers['cookie'] || '').match(/i=(!\w+)/) || [null, null])[1];
    }
    function compareOrigin(req) {
        function normalizeUrl(url) {
            return url[url.length - 1] === '/' ? url.substr(0, url.length - 1) : url;
        }
        // req.headers['referer'] は常に string ですが、型定義の都合上
        // string | string[] になっているので string を明示しています
        const referer = req.headers['referer'];
        return (normalizeUrl(referer) == normalizeUrl(conf_1.default.url));
    }
    app.get('/disconnect/twitter', async (req, res) => {
        if (!compareOrigin(req)) {
            res.status(400).send('invalid origin');
            return;
        }
        const userToken = getUserToken(req);
        if (userToken == null)
            return res.send('plz signin');
        const user = await user_1.default.findOneAndUpdate({
            token: userToken
        }, {
            $set: {
                twitter: null
            }
        });
        res.send(`Twitterの連携を解除しました :v:`);
        // Publish i updated event
        event_1.default(user._id, 'i_updated', await user_1.pack(user, user, {
            detail: true,
            includeSecrets: true
        }));
    });
    if (conf_1.default.twitter == null) {
        app.get('/connect/twitter', (req, res) => {
            res.send('現在Twitterへ接続できません (このインスタンスではTwitterはサポートされていません)');
        });
        app.get('/signin/twitter', (req, res) => {
            res.send('現在Twitterへ接続できません (このインスタンスではTwitterはサポートされていません)');
        });
        return;
    }
    const twAuth = autwh_1.default({
        consumerKey: conf_1.default.twitter.consumer_key,
        consumerSecret: conf_1.default.twitter.consumer_secret,
        callbackUrl: `${conf_1.default.api_url}/tw/cb`
    });
    app.get('/connect/twitter', async (req, res) => {
        if (!compareOrigin(req)) {
            res.status(400).send('invalid origin');
            return;
        }
        const userToken = getUserToken(req);
        if (userToken == null)
            return res.send('plz signin');
        const ctx = await twAuth.begin();
        redis_1.default.set(userToken, JSON.stringify(ctx));
        res.redirect(ctx.url);
    });
    app.get('/signin/twitter', async (req, res) => {
        const ctx = await twAuth.begin();
        const sessid = uuid();
        redis_1.default.set(sessid, JSON.stringify(ctx));
        const expires = 1000 * 60 * 60; // 1h
        res.cookie('signin_with_twitter_session_id', sessid, {
            path: '/',
            domain: `.${conf_1.default.host}`,
            secure: conf_1.default.url.substr(0, 5) === 'https',
            httpOnly: true,
            expires: new Date(Date.now() + expires),
            maxAge: expires
        });
        res.redirect(ctx.url);
    });
    app.get('/tw/cb', (req, res) => {
        const userToken = getUserToken(req);
        if (userToken == null) {
            // req.headers['cookie'] は常に string ですが、型定義の都合上
            // string | string[] になっているので string を明示しています
            const cookies = cookie.parse((req.headers['cookie'] || ''));
            const sessid = cookies['signin_with_twitter_session_id'];
            if (sessid == undefined) {
                res.status(400).send('invalid session');
                return;
            }
            redis_1.default.get(sessid, async (_, ctx) => {
                const result = await twAuth.done(JSON.parse(ctx), req.query.oauth_verifier);
                const user = await user_1.default.findOne({
                    'twitter.user_id': result.userId
                });
                if (user == null) {
                    res.status(404).send(`@${result.screenName}と連携しているMisskeyアカウントはありませんでした...`);
                    return;
                }
                signin_1.default(res, user, true);
            });
        }
        else {
            const verifier = req.query.oauth_verifier;
            if (verifier == null) {
                res.status(400).send('invalid session');
                return;
            }
            redis_1.default.get(userToken, async (_, ctx) => {
                const result = await twAuth.done(JSON.parse(ctx), verifier);
                const user = await user_1.default.findOneAndUpdate({
                    token: userToken
                }, {
                    $set: {
                        twitter: {
                            access_token: result.accessToken,
                            access_token_secret: result.accessTokenSecret,
                            user_id: result.userId,
                            screen_name: result.screenName
                        }
                    }
                });
                res.send(`Twitter: @${result.screenName} を、Misskey: @${user.username} に接続しました！`);
                // Publish i updated event
                event_1.default(user._id, 'i_updated', await user_1.pack(user, user, {
                    detail: true,
                    includeSecrets: true
                }));
            });
        }
    });
};
