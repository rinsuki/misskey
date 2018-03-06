"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb = require("mongodb");
const deepcopy = require("deepcopy");
const drive_folder_1 = require("./drive-folder");
const conf_1 = require("../../conf");
const mongodb_1 = require("../../db/mongodb");
const DriveFile = mongodb_1.default.get('drive_files.files');
exports.default = DriveFile;
const getGridFSBucket = async () => {
    const db = await mongodb_1.nativeDbConn();
    const bucket = new mongodb.GridFSBucket(db, {
        bucketName: 'drive_files'
    });
    return bucket;
};
exports.getGridFSBucket = getGridFSBucket;
function validateFileName(name) {
    return ((name.trim().length > 0) &&
        (name.length <= 200) &&
        (name.indexOf('\\') === -1) &&
        (name.indexOf('/') === -1) &&
        (name.indexOf('..') === -1));
}
exports.validateFileName = validateFileName;
/**
 * Pack a drive file for API response
 *
 * @param {any} file
 * @param {any} options?
 * @return {Promise<any>}
 */
exports.pack = (file, options) => new Promise(async (resolve, reject) => {
    const opts = Object.assign({
        detail: false
    }, options);
    let _file;
    // Populate the file if 'file' is ID
    if (mongodb.ObjectID.prototype.isPrototypeOf(file)) {
        _file = await DriveFile.findOne({
            _id: file
        });
    }
    else if (typeof file === 'string') {
        _file = await DriveFile.findOne({
            _id: new mongodb.ObjectID(file)
        });
    }
    else {
        _file = deepcopy(file);
    }
    if (!_file)
        return reject('invalid file arg.');
    // rendered target
    let _target = {};
    _target.id = _file._id;
    _target.created_at = _file.uploadDate;
    _target.name = _file.filename;
    _target.type = _file.contentType;
    _target.datasize = _file.length;
    _target.md5 = _file.md5;
    _target = Object.assign(_target, _file.metadata);
    _target.url = `${conf_1.default.drive_url}/${_target.id}/${encodeURIComponent(_target.name)}`;
    if (_target.properties == null)
        _target.properties = {};
    if (opts.detail) {
        if (_target.folder_id) {
            // Populate folder
            _target.folder = await drive_folder_1.pack(_target.folder_id, {
                detail: true
            });
        }
        /*
        if (_target.tags) {
            // Populate tags
            _target.tags = await _target.tags.map(async (tag: any) =>
                await serializeDriveTag(tag)
            );
        }
        */
    }
    resolve(_target);
});
