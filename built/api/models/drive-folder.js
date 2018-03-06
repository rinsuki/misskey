"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = require("mongodb");
const deepcopy = require("deepcopy");
const mongodb_1 = require("../../db/mongodb");
const drive_file_1 = require("./drive-file");
const DriveFolder = mongodb_1.default.get('drive_folders');
exports.default = DriveFolder;
function isValidFolderName(name) {
    return ((name.trim().length > 0) &&
        (name.length <= 200));
}
exports.isValidFolderName = isValidFolderName;
/**
 * Pack a drive folder for API response
 *
 * @param {any} folder
 * @param {any} options?
 * @return {Promise<any>}
 */
exports.pack = (folder, options) => new Promise(async (resolve, reject) => {
    const opts = Object.assign({
        detail: false
    }, options);
    let _folder;
    // Populate the folder if 'folder' is ID
    if (mongo.ObjectID.prototype.isPrototypeOf(folder)) {
        _folder = await DriveFolder.findOne({ _id: folder });
    }
    else if (typeof folder === 'string') {
        _folder = await DriveFolder.findOne({ _id: new mongo.ObjectID(folder) });
    }
    else {
        _folder = deepcopy(folder);
    }
    // Rename _id to id
    _folder.id = _folder._id;
    delete _folder._id;
    if (opts.detail) {
        const childFoldersCount = await DriveFolder.count({
            parent_id: _folder.id
        });
        const childFilesCount = await drive_file_1.default.count({
            'metadata.folder_id': _folder.id
        });
        _folder.folders_count = childFoldersCount;
        _folder.files_count = childFilesCount;
    }
    if (opts.detail && _folder.parent_id) {
        // Populate parent folder
        _folder.parent = await exports.pack(_folder.parent_id, {
            detail: true
        });
    }
    resolve(_folder);
});
