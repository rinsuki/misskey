"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const websocket = require("websocket");
const redis = require("redis");
const conf_1 = require("../conf");
const user_1 = require("./models/user");
const access_token_1 = require("./models/access-token");
const is_native_token_1 = require("./common/is-native-token");
const home_1 = require("./stream/home");
const drive_1 = require("./stream/drive");
const messaging_1 = require("./stream/messaging");
const messaging_index_1 = require("./stream/messaging-index");
const server_1 = require("./stream/server");
const requests_1 = require("./stream/requests");
const channel_1 = require("./stream/channel");
module.exports = (server) => {
    /**
     * Init websocket server
     */
    const ws = new websocket.server({
        httpServer: server
    });
    ws.on('request', async (request) => {
        const connection = request.accept();
        if (request.resourceURL.pathname === '/server') {
            server_1.default(request, connection);
            return;
        }
        if (request.resourceURL.pathname === '/requests') {
            requests_1.default(request, connection);
            return;
        }
        // Connect to Redis
        const subscriber = redis.createClient(conf_1.default.redis.port, conf_1.default.redis.host);
        connection.on('close', () => {
            subscriber.unsubscribe();
            subscriber.quit();
        });
        if (request.resourceURL.pathname === '/channel') {
            channel_1.default(request, connection, subscriber);
            return;
        }
        const user = await authenticate(request.resourceURL.query.i);
        if (user == null) {
            connection.send('authentication-failed');
            connection.close();
            return;
        }
        const channel = request.resourceURL.pathname === '/' ? home_1.default :
            request.resourceURL.pathname === '/drive' ? drive_1.default :
                request.resourceURL.pathname === '/messaging' ? messaging_1.default :
                    request.resourceURL.pathname === '/messaging-index' ? messaging_index_1.default :
                        null;
        if (channel !== null) {
            channel(request, connection, subscriber, user);
        }
        else {
            connection.close();
        }
    });
};
/**
 * 接続してきたユーザーを取得します
 * @param token 送信されてきたトークン
 */
function authenticate(token) {
    if (token == null) {
        return Promise.resolve(null);
    }
    return new Promise(async (resolve, reject) => {
        if (is_native_token_1.default(token)) {
            // Fetch user
            const user = await user_1.default
                .findOne({
                token: token
            });
            resolve(user);
        }
        else {
            const accessToken = await access_token_1.default.findOne({
                hash: token
            });
            if (accessToken == null) {
                return reject('invalid signature');
            }
            // Fetch user
            const user = await user_1.default
                .findOne({ _id: accessToken.user_id });
            resolve(user);
        }
    });
}
