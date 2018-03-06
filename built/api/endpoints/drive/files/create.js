"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const drive_file_1 = require("../../../models/drive-file");
const add_file_to_drive_1 = require("../../../common/add-file-to-drive");
/**
 * Create a file
 *
 * @param {any} file
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (file, params, user) => {
    if (file == null) {
        throw 'file is required';
    }
    // Get 'name' parameter
    let name = file.originalname;
    if (name !== undefined && name !== null) {
        name = name.trim();
        if (name.length === 0) {
            name = null;
        }
        else if (name === 'blob') {
            name = null;
        }
        else if (!drive_file_1.validateFileName(name)) {
            throw 'invalid name';
        }
    }
    else {
        name = null;
    }
    // Get 'folder_id' parameter
    const [folderId = null, folderIdErr] = cafy_1.default(params.folder_id).optional.nullable.id().$;
    if (folderIdErr)
        throw 'invalid folder_id param';
    try {
        // Create file
        const driveFile = await add_file_to_drive_1.default(user, file.path, name, null, folderId);
        // Serialize
        return drive_file_1.pack(driveFile);
    }
    catch (e) {
        console.error(e);
        throw e;
    }
};
