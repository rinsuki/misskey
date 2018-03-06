"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = require("mongodb");
const deepcopy = require("deepcopy");
const mongodb_1 = require("../../db/mongodb");
const app_1 = require("./app");
const AuthSession = mongodb_1.default.get('auth_sessions');
exports.default = AuthSession;
/**
 * Pack an auth session for API response
 *
 * @param {any} session
 * @param {any} me?
 * @return {Promise<any>}
 */
exports.pack = (session, me) => new Promise(async (resolve, reject) => {
    let _session;
    // TODO: Populate session if it ID
    _session = deepcopy(session);
    // Me
    if (me && !mongo.ObjectID.prototype.isPrototypeOf(me)) {
        if (typeof me === 'string') {
            me = new mongo.ObjectID(me);
        }
        else {
            me = me._id;
        }
    }
    delete _session._id;
    // Populate app
    _session.app = await app_1.pack(_session.app_id, me);
    resolve(_session);
});
