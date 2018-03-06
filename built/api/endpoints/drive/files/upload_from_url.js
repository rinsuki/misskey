"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const URL = require("url");
const cafy_1 = require("cafy");
const drive_file_1 = require("../../../models/drive-file");
const add_file_to_drive_1 = require("../../../common/add-file-to-drive");
const debug = require("debug");
const tmp = require("tmp");
const fs = require("fs");
const request = require("request");
const log = debug('misskey:endpoint:upload_from_url');
/**
 * Create a file from a URL
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => {
    // Get 'url' parameter
    // TODO: Validate this url
    const [url, urlErr] = cafy_1.default(params.url).string().$;
    if (urlErr)
        throw 'invalid url param';
    let name = URL.parse(url).pathname.split('/').pop();
    if (!drive_file_1.validateFileName(name)) {
        name = null;
    }
    // Get 'folder_id' parameter
    const [folderId = null, folderIdErr] = cafy_1.default(params.folder_id).optional.nullable.id().$;
    if (folderIdErr)
        throw 'invalid folder_id param';
    // Create temp file
    const path = await new Promise((res, rej) => {
        tmp.file((e, path) => {
            if (e)
                return rej(e);
            res(path);
        });
    });
    // write content at URL to temp file
    await new Promise((res, rej) => {
        const writable = fs.createWriteStream(path);
        request(url)
            .on('error', rej)
            .on('end', () => {
            writable.close();
            res(path);
        })
            .pipe(writable)
            .on('error', rej);
    });
    const driveFile = await add_file_to_drive_1.default(user, path, name, null, folderId);
    // clean-up
    fs.unlink(path, (e) => {
        if (e)
            log(e.stack);
    });
    return drive_file_1.pack(driveFile);
};
