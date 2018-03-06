"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const conf_1 = require("../conf");
const u = conf_1.default.mongodb.user ? encodeURIComponent(conf_1.default.mongodb.user) : null;
const p = conf_1.default.mongodb.pass ? encodeURIComponent(conf_1.default.mongodb.pass) : null;
const uri = u && p
    ? `mongodb://${u}:${p}@${conf_1.default.mongodb.host}:${conf_1.default.mongodb.port}/${conf_1.default.mongodb.db}`
    : `mongodb://${conf_1.default.mongodb.host}:${conf_1.default.mongodb.port}/${conf_1.default.mongodb.db}`;
/**
 * monk
 */
const monk_1 = require("monk");
const db = monk_1.default(uri);
exports.default = db;
/**
 * MongoDB native module (officialy)
 */
const mongodb = require("mongodb");
let mdb;
const nativeDbConn = async () => {
    if (mdb)
        return mdb;
    const db = await (() => new Promise((resolve, reject) => {
        mongodb.MongoClient.connect(uri, (e, client) => {
            if (e)
                return reject(e);
            resolve(client.db(conf_1.default.mongodb.db));
        });
    }))();
    mdb = db;
    return db;
};
exports.nativeDbConn = nativeDbConn;
