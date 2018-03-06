"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const bcrypt = require("bcryptjs");
const user_1 = require("../models/user");
const get_post_summary_1 = require("../../common/get-post-summary");
const get_user_summary_1 = require("../../common/get-user-summary");
const get_notification_summary_1 = require("../../common/get-notification-summary");
const othello_1 = require("../../common/othello");
const hmm = [
    '？',
    'ふぅ～む...？',
    'ちょっと何言ってるかわからないです',
    '「ヘルプ」と言うと利用可能な操作が確認できますよ'
];
/**
 * Botの頭脳
 */
class BotCore extends EventEmitter {
    constructor(user) {
        super();
        this.user = null;
        this.context = null;
        this.user = user;
    }
    clearContext() {
        this.setContext(null);
    }
    setContext(context) {
        this.context = context;
        this.emit('updated');
        if (context) {
            context.on('updated', () => {
                this.emit('updated');
            });
        }
    }
    export() {
        return {
            user: this.user,
            context: this.context ? this.context.export() : null
        };
    }
    _import(data) {
        this.user = data.user ? user_1.init(data.user) : null;
        this.setContext(data.context ? Context.import(this, data.context) : null);
    }
    static import(data) {
        const bot = new BotCore();
        bot._import(data);
        return bot;
    }
    async q(query) {
        if (this.context != null) {
            return await this.context.q(query);
        }
        if (/^@[a-zA-Z0-9-]+$/.test(query)) {
            return await this.showUserCommand(query);
        }
        switch (query) {
            case 'ping':
                return 'PONG';
            case 'help':
            case 'ヘルプ':
                return '利用可能なコマンド一覧です:\n' +
                    'help: これです\n' +
                    'me: アカウント情報を見ます\n' +
                    'login, signin: サインインします\n' +
                    'logout, signout: サインアウトします\n' +
                    'post: 投稿します\n' +
                    'tl: タイムラインを見ます\n' +
                    'no: 通知を見ます\n' +
                    '@<ユーザー名>: ユーザーを表示します\n' +
                    '\n' +
                    'タイムラインや通知を見た後、「次」というとさらに遡ることができます。';
            case 'me':
                return this.user ? `${this.user.name}としてサインインしています。\n\n${get_user_summary_1.default(this.user)}` : 'サインインしていません';
            case 'login':
            case 'signin':
            case 'ログイン':
            case 'サインイン':
                if (this.user != null)
                    return '既にサインインしていますよ！';
                this.setContext(new SigninContext(this));
                return await this.context.greet();
            case 'logout':
            case 'signout':
            case 'ログアウト':
            case 'サインアウト':
                if (this.user == null)
                    return '今はサインインしてないですよ！';
                this.signout();
                return 'ご利用ありがとうございました <3';
            case 'post':
            case '投稿':
                if (this.user == null)
                    return 'まずサインインしてください。';
                this.setContext(new PostContext(this));
                return await this.context.greet();
            case 'tl':
            case 'タイムライン':
                if (this.user == null)
                    return 'まずサインインしてください。';
                this.setContext(new TlContext(this));
                return await this.context.greet();
            case 'no':
            case 'notifications':
            case '通知':
                if (this.user == null)
                    return 'まずサインインしてください。';
                this.setContext(new NotificationsContext(this));
                return await this.context.greet();
            case 'guessing-game':
            case '数当てゲーム':
                this.setContext(new GuessingGameContext(this));
                return await this.context.greet();
            case 'othello':
            case 'オセロ':
                this.setContext(new OthelloContext(this));
                return await this.context.greet();
            default:
                return hmm[Math.floor(Math.random() * hmm.length)];
        }
    }
    signin(user) {
        this.user = user;
        this.emit('signin', user);
        this.emit('updated');
    }
    signout() {
        const user = this.user;
        this.user = null;
        this.emit('signout', user);
        this.emit('updated');
    }
    async refreshUser() {
        this.user = await user_1.default.findOne({
            _id: this.user._id
        }, {
            fields: {
                data: false
            }
        });
        this.emit('updated');
    }
    async showUserCommand(q) {
        try {
            const user = await require('../endpoints/users/show')({
                username: q.substr(1)
            }, this.user);
            const text = get_user_summary_1.default(user);
            return text;
        }
        catch (e) {
            return `問題が発生したようです...: ${e}`;
        }
    }
}
exports.default = BotCore;
class Context extends EventEmitter {
    constructor(bot) {
        super();
        this.bot = bot;
    }
    static import(bot, data) {
        if (data.type == 'guessing-game')
            return GuessingGameContext.import(bot, data.content);
        if (data.type == 'othello')
            return OthelloContext.import(bot, data.content);
        if (data.type == 'post')
            return PostContext.import(bot, data.content);
        if (data.type == 'tl')
            return TlContext.import(bot, data.content);
        if (data.type == 'notifications')
            return NotificationsContext.import(bot, data.content);
        if (data.type == 'signin')
            return SigninContext.import(bot, data.content);
        return null;
    }
}
class SigninContext extends Context {
    constructor() {
        super(...arguments);
        this.temporaryUser = null;
    }
    async greet() {
        return 'まずユーザー名を教えてください:';
    }
    async q(query) {
        if (this.temporaryUser == null) {
            // Fetch user
            const user = await user_1.default.findOne({
                username_lower: query.toLowerCase()
            }, {
                fields: {
                    data: false
                }
            });
            if (user === null) {
                return `${query}というユーザーは存在しませんでした... もう一度教えてください:`;
            }
            else {
                this.temporaryUser = user;
                this.emit('updated');
                return `パスワードを教えてください:`;
            }
        }
        else {
            // Compare password
            const same = await bcrypt.compare(query, this.temporaryUser.password);
            if (same) {
                this.bot.signin(this.temporaryUser);
                this.bot.clearContext();
                return `${this.temporaryUser.name}さん、おかえりなさい！`;
            }
            else {
                return `パスワードが違います... もう一度教えてください:`;
            }
        }
    }
    export() {
        return {
            type: 'signin',
            content: {
                temporaryUser: this.temporaryUser
            }
        };
    }
    static import(bot, data) {
        const context = new SigninContext(bot);
        context.temporaryUser = data.temporaryUser;
        return context;
    }
}
class PostContext extends Context {
    async greet() {
        return '内容:';
    }
    async q(query) {
        await require('../endpoints/posts/create')({
            text: query
        }, this.bot.user);
        this.bot.clearContext();
        return '投稿しましたよ！';
    }
    export() {
        return {
            type: 'post'
        };
    }
    static import(bot, data) {
        const context = new PostContext(bot);
        return context;
    }
}
class TlContext extends Context {
    constructor() {
        super(...arguments);
        this.next = null;
    }
    async greet() {
        return await this.getTl();
    }
    async q(query) {
        if (query == '次') {
            return await this.getTl();
        }
        else {
            this.bot.clearContext();
            return await this.bot.q(query);
        }
    }
    async getTl() {
        const tl = await require('../endpoints/posts/timeline')({
            limit: 5,
            until_id: this.next ? this.next : undefined
        }, this.bot.user);
        if (tl.length > 0) {
            this.next = tl[tl.length - 1].id;
            this.emit('updated');
            const text = tl
                .map(post => `${post.user.name}\n「${get_post_summary_1.default(post)}」`)
                .join('\n-----\n');
            return text;
        }
        else {
            return 'タイムラインに表示するものがありません...';
        }
    }
    export() {
        return {
            type: 'tl',
            content: {
                next: this.next,
            }
        };
    }
    static import(bot, data) {
        const context = new TlContext(bot);
        context.next = data.next;
        return context;
    }
}
class NotificationsContext extends Context {
    constructor() {
        super(...arguments);
        this.next = null;
    }
    async greet() {
        return await this.getNotifications();
    }
    async q(query) {
        if (query == '次') {
            return await this.getNotifications();
        }
        else {
            this.bot.clearContext();
            return await this.bot.q(query);
        }
    }
    async getNotifications() {
        const notifications = await require('../endpoints/i/notifications')({
            limit: 5,
            until_id: this.next ? this.next : undefined
        }, this.bot.user);
        if (notifications.length > 0) {
            this.next = notifications[notifications.length - 1].id;
            this.emit('updated');
            const text = notifications
                .map(notification => get_notification_summary_1.default(notification))
                .join('\n-----\n');
            return text;
        }
        else {
            return '通知はありません';
        }
    }
    export() {
        return {
            type: 'notifications',
            content: {
                next: this.next,
            }
        };
    }
    static import(bot, data) {
        const context = new NotificationsContext(bot);
        context.next = data.next;
        return context;
    }
}
class GuessingGameContext extends Context {
    constructor() {
        super(...arguments);
        this.history = [];
    }
    async greet() {
        this.secret = Math.floor(Math.random() * 100);
        this.emit('updated');
        return '0~100の秘密の数を当ててみてください:';
    }
    async q(query) {
        if (query == 'やめる') {
            this.bot.clearContext();
            return 'やめました。';
        }
        const guess = parseInt(query, 10);
        if (isNaN(guess)) {
            return '整数で推測してください。「やめる」と言うとゲームをやめます。';
        }
        const firsttime = this.history.indexOf(guess) === -1;
        this.history.push(guess);
        this.emit('updated');
        if (this.secret < guess) {
            return firsttime ? `${guess}よりも小さいですね` : `もう一度言いますが${guess}より小さいですよ`;
        }
        else if (this.secret > guess) {
            return firsttime ? `${guess}よりも大きいですね` : `もう一度言いますが${guess}より大きいですよ`;
        }
        else {
            this.bot.clearContext();
            return `正解です🎉 (${this.history.length}回目で当てました)`;
        }
    }
    export() {
        return {
            type: 'guessing-game',
            content: {
                secret: this.secret,
                history: this.history
            }
        };
    }
    static import(bot, data) {
        const context = new GuessingGameContext(bot);
        context.secret = data.secret;
        context.history = data.history;
        return context;
    }
}
class OthelloContext extends Context {
    constructor(bot) {
        super(bot);
        this.othello = null;
        this.othello = new othello_1.default();
    }
    async greet() {
        return this.othello.toPatternString('black');
    }
    async q(query) {
        if (query == 'やめる') {
            this.bot.clearContext();
            return 'オセロをやめました。';
        }
        const n = parseInt(query, 10);
        if (isNaN(n)) {
            return '番号で指定してください。「やめる」と言うとゲームをやめます。';
        }
        this.othello.setByNumber('black', n);
        const s = this.othello.toString() + '\n\n...(AI)...\n\n';
        othello_1.ai('white', this.othello);
        if (this.othello.getPattern('black').length === 0) {
            this.bot.clearContext();
            const blackCount = this.othello.board.map(row => row.filter(s => s == 'black').length).reduce((a, b) => a + b);
            const whiteCount = this.othello.board.map(row => row.filter(s => s == 'white').length).reduce((a, b) => a + b);
            const winner = blackCount == whiteCount ? '引き分け' : blackCount > whiteCount ? '黒の勝ち' : '白の勝ち';
            return this.othello.toString() + `\n\n～終了～\n\n黒${blackCount}、白${whiteCount}で${winner}です。`;
        }
        else {
            this.emit('updated');
            return s + this.othello.toPatternString('black');
        }
    }
    export() {
        return {
            type: 'othello',
            content: {
                board: this.othello.board
            }
        };
    }
    static import(bot, data) {
        const context = new OthelloContext(bot);
        context.othello = new othello_1.default();
        context.othello.board = data.board;
        return context;
    }
}
