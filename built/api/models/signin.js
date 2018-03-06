"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deepcopy = require("deepcopy");
const mongodb_1 = require("../../db/mongodb");
const Signin = mongodb_1.default.get('signin');
exports.default = Signin;
/**
 * Pack a signin record for API response
 *
 * @param {any} record
 * @return {Promise<any>}
 */
exports.pack = (record) => new Promise(async (resolve, reject) => {
    const _record = deepcopy(record);
    // Rename _id to id
    _record.id = _record._id;
    delete _record._id;
    resolve(_record);
});
