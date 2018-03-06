"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const request = require("request");
const crypto = require("crypto");
const user_1 = require("../../models/user");
const conf_1 = require("../../../conf");
const core_1 = require("../core");
const redis_1 = require("../../../db/redis");
const prominence = require("prominence");
const get_post_summary_1 = require("../../../common/get-post-summary");
const redis = prominence(redis_1.default);
// SEE: https://developers.line.me/media/messaging-api/messages/sticker_list.pdf
const stickers = [
    '297',
    '298',
    '299',
    '300',
    '301',
    '302',
    '303',
    '304',
    '305',
    '306',
    '307'
];
class LineBot extends core_1.default {
    reply(messages) {
        request.post({
            url: 'https://api.line.me/v2/bot/message/reply',
            headers: {
                'Authorization': `Bearer ${conf_1.default.line_bot.channel_access_token}`
            },
            json: {
                replyToken: this.replyToken,
                messages: messages
            }
        }, (err, res, body) => {
            if (err) {
                console.error(err);
                return;
            }
        });
    }
    async react(ev) {
        this.replyToken = ev.replyToken;
        switch (ev.type) {
            // メッセージ
            case 'message':
                switch (ev.message.type) {
                    // テキスト
                    case 'text':
                        const res = await this.q(ev.message.text);
                        if (res == null)
                            return;
                        // 返信
                        this.reply([{
                                type: 'text',
                                text: res
                            }]);
                        break;
                    // スタンプ
                    case 'sticker':
                        // スタンプで返信
                        this.reply([{
                                type: 'sticker',
                                packageId: '4',
                                stickerId: stickers[Math.floor(Math.random() * stickers.length)]
                            }]);
                        break;
                }
                break;
            // postback
            case 'postback':
                const data = ev.postback.data;
                const cmd = data.split('|')[0];
                const arg = data.split('|')[1];
                switch (cmd) {
                    case 'showtl':
                        this.showUserTimelinePostback(arg);
                        break;
                }
                break;
        }
    }
    static import(data) {
        const bot = new LineBot();
        bot._import(data);
        return bot;
    }
    async showUserCommand(q) {
        const user = await require('../../endpoints/users/show')({
            username: q.substr(1)
        }, this.user);
        const actions = [];
        actions.push({
            type: 'postback',
            label: 'タイムラインを見る',
            data: `showtl|${user.id}`
        });
        if (user.twitter) {
            actions.push({
                type: 'uri',
                label: 'Twitterアカウントを見る',
                uri: `https://twitter.com/${user.twitter.screen_name}`
            });
        }
        actions.push({
            type: 'uri',
            label: 'Webで見る',
            uri: `${conf_1.default.url}/${user.username}`
        });
        this.reply([{
                type: 'template',
                altText: await super.showUserCommand(q),
                template: {
                    type: 'buttons',
                    thumbnailImageUrl: `${user.avatar_url}?thumbnail&size=1024`,
                    title: `${user.name} (@${user.username})`,
                    text: user.description || '(no description)',
                    actions: actions
                }
            }]);
        return null;
    }
    async showUserTimelinePostback(userId) {
        const tl = await require('../../endpoints/users/posts')({
            user_id: userId,
            limit: 5
        }, this.user);
        const text = `${tl[0].user.name}さんのタイムラインはこちらです:\n\n` + tl
            .map(post => get_post_summary_1.default(post))
            .join('\n-----\n');
        this.reply([{
                type: 'text',
                text: text
            }]);
    }
}
module.exports = async (app) => {
    if (conf_1.default.line_bot == null)
        return;
    const handler = new EventEmitter();
    handler.on('event', async (ev) => {
        const sourceId = ev.source.userId;
        const sessionId = `line-bot-sessions:${sourceId}`;
        const session = await redis.get(sessionId);
        let bot;
        if (session == null) {
            const user = await user_1.default.findOne({
                line: {
                    user_id: sourceId
                }
            });
            bot = new LineBot(user);
            bot.on('signin', user => {
                user_1.default.update(user._id, {
                    $set: {
                        line: {
                            user_id: sourceId
                        }
                    }
                });
            });
            bot.on('signout', user => {
                user_1.default.update(user._id, {
                    $set: {
                        line: {
                            user_id: null
                        }
                    }
                });
            });
            redis.set(sessionId, JSON.stringify(bot.export()));
        }
        else {
            bot = LineBot.import(JSON.parse(session));
        }
        bot.on('updated', () => {
            redis.set(sessionId, JSON.stringify(bot.export()));
        });
        if (session != null)
            bot.refreshUser();
        bot.react(ev);
    });
    app.post('/hooks/line', (req, res, next) => {
        // req.headers['x-line-signature'] は常に string ですが、型定義の都合上
        // string | string[] になっているので string を明示しています
        const sig1 = req.headers['x-line-signature'];
        const hash = crypto.createHmac('SHA256', conf_1.default.line_bot.channel_secret)
            .update(req.rawBody);
        const sig2 = hash.digest('base64');
        // シグネチャ比較
        if (sig1 === sig2) {
            req.body.events.forEach(ev => {
                handler.emit('event', ev);
            });
            res.sendStatus(200);
        }
        else {
            res.sendStatus(400);
        }
    });
};
