"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const drive_file_1 = require("../../models/drive-file");
/**
 * Get drive files
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @return {Promise<any>}
 */
module.exports = async (params, user, app) => {
    // Get 'limit' parameter
    const [limit = 10, limitErr] = cafy_1.default(params.limit).optional.number().range(1, 100).$;
    if (limitErr)
        throw 'invalid limit param';
    // Get 'since_id' parameter
    const [sinceId, sinceIdErr] = cafy_1.default(params.since_id).optional.id().$;
    if (sinceIdErr)
        throw 'invalid since_id param';
    // Get 'until_id' parameter
    const [untilId, untilIdErr] = cafy_1.default(params.until_id).optional.id().$;
    if (untilIdErr)
        throw 'invalid until_id param';
    // Check if both of since_id and until_id is specified
    if (sinceId && untilId) {
        throw 'cannot set since_id and until_id';
    }
    // Get 'folder_id' parameter
    const [folderId = null, folderIdErr] = cafy_1.default(params.folder_id).optional.nullable.id().$;
    if (folderIdErr)
        throw 'invalid folder_id param';
    // Get 'type' parameter
    const [type, typeErr] = cafy_1.default(params.type).optional.string().match(/^[a-zA-Z\/\-\*]+$/).$;
    if (typeErr)
        throw 'invalid type param';
    // Construct query
    const sort = {
        _id: -1
    };
    const query = {
        'metadata.user_id': user._id,
        'metadata.folder_id': folderId
    };
    if (sinceId) {
        sort._id = 1;
        query._id = {
            $gt: sinceId
        };
    }
    else if (untilId) {
        query._id = {
            $lt: untilId
        };
    }
    if (type) {
        query.contentType = new RegExp(`^${type.replace(/\*/g, '.+?')}$`);
    }
    // Issue query
    const files = await drive_file_1.default
        .find(query, {
        limit: limit,
        sort: sort
    });
    // Serialize
    const _files = await Promise.all(files.map(file => drive_file_1.pack(file)));
    return _files;
};
