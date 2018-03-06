"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const fs = require("fs");
const tmp = require("tmp");
const crypto = require("crypto");
const _gm = require("gm");
const debug = require("debug");
const fileType = require("file-type");
const prominence = require("prominence");
const drive_file_1 = require("../models/drive-file");
const drive_folder_1 = require("../models/drive-folder");
const drive_file_2 = require("../models/drive-file");
const event_1 = require("../event");
const conf_1 = require("../../conf");
const gm = _gm.subClass({
    imageMagick: true
});
const log = debug('misskey:register-drive-file');
const tmpFile = () => new Promise((resolve, reject) => {
    tmp.file((e, path) => {
        if (e)
            return reject(e);
        resolve(path);
    });
});
const addToGridFS = (name, readable, type, metadata) => drive_file_1.getGridFSBucket()
    .then(bucket => new Promise((resolve, reject) => {
    const writeStream = bucket.openUploadStream(name, { contentType: type, metadata });
    writeStream.once('finish', (doc) => { resolve(doc); });
    writeStream.on('error', reject);
    readable.pipe(writeStream);
}));
const addFile = async (user, path, name = null, comment = null, folderId = null, force = false) => {
    log(`registering ${name} (user: ${user.username}, path: ${path})`);
    // Calculate hash, get content type and get file size
    const [hash, [mime, ext], size] = await Promise.all([
        // hash
        (() => new Promise((res, rej) => {
            const readable = fs.createReadStream(path);
            const hash = crypto.createHash('md5');
            const chunks = [];
            readable
                .on('error', rej)
                .pipe(hash)
                .on('error', rej)
                .on('data', (chunk) => chunks.push(chunk))
                .on('end', () => {
                const buffer = buffer_1.Buffer.concat(chunks);
                res(buffer.toString('hex'));
            });
        }))(),
        // mime
        (() => new Promise((res, rej) => {
            const readable = fs.createReadStream(path);
            readable
                .on('error', rej)
                .once('data', (buffer) => {
                readable.destroy();
                const type = fileType(buffer);
                if (type) {
                    return res([type.mime, type.ext]);
                }
                else {
                    // 種類が同定できなかったら application/octet-stream にする
                    return res(['application/octet-stream', null]);
                }
            });
        }))(),
        // size
        (() => new Promise((res, rej) => {
            fs.stat(path, (err, stats) => {
                if (err)
                    return rej(err);
                res(stats.size);
            });
        }))()
    ]);
    log(`hash: ${hash}, mime: ${mime}, ext: ${ext}, size: ${size}`);
    // detect name
    const detectedName = name || (ext ? `untitled.${ext}` : 'untitled');
    if (!force) {
        // Check if there is a file with the same hash
        const much = await drive_file_1.default.findOne({
            md5: hash,
            'metadata.user_id': user._id
        });
        if (much !== null) {
            log('file with same hash is found');
            return much;
        }
        else {
            log('file with same hash is not found');
        }
    }
    const [wh, averageColor, folder] = await Promise.all([
        // Width and height (when image)
        (async () => {
            // 画像かどうか
            if (!/^image\/.*$/.test(mime)) {
                return null;
            }
            const imageType = mime.split('/')[1];
            // 画像でもPNGかJPEGかGIFでないならスキップ
            if (imageType != 'png' && imageType != 'jpeg' && imageType != 'gif') {
                return null;
            }
            log('calculate image width and height...');
            // Calculate width and height
            const g = gm(fs.createReadStream(path), name);
            const size = await prominence(g).size();
            log(`image width and height is calculated: ${size.width}, ${size.height}`);
            return [size.width, size.height];
        })(),
        // average color (when image)
        (async () => {
            // 画像かどうか
            if (!/^image\/.*$/.test(mime)) {
                return null;
            }
            const imageType = mime.split('/')[1];
            // 画像でもPNGかJPEGでないならスキップ
            if (imageType != 'png' && imageType != 'jpeg') {
                return null;
            }
            log('calculate average color...');
            const buffer = await prominence(gm(fs.createReadStream(path), name)
                .setFormat('ppm')
                .resize(1, 1)) // 1pxのサイズに縮小して平均色を取得するというハック
                .toBuffer();
            const r = buffer.readUInt8(buffer.length - 3);
            const g = buffer.readUInt8(buffer.length - 2);
            const b = buffer.readUInt8(buffer.length - 1);
            log(`average color is calculated: ${r}, ${g}, ${b}`);
            return [r, g, b];
        })(),
        // folder
        (async () => {
            if (!folderId) {
                return null;
            }
            const driveFolder = await drive_folder_1.default.findOne({
                _id: folderId,
                user_id: user._id
            });
            if (!driveFolder) {
                throw 'folder-not-found';
            }
            return driveFolder;
        })(),
        // usage checker
        (async () => {
            // Calculate drive usage
            const usage = await drive_file_1.default
                .aggregate([{
                    $match: { 'metadata.user_id': user._id }
                }, {
                    $project: {
                        length: true
                    }
                }, {
                    $group: {
                        _id: null,
                        usage: { $sum: '$length' }
                    }
                }])
                .then((aggregates) => {
                if (aggregates.length > 0) {
                    return aggregates[0].usage;
                }
                return 0;
            });
            log(`drive usage is ${usage}`);
            // If usage limit exceeded
            if (usage + size > user.drive_capacity) {
                throw 'no-free-space';
            }
        })()
    ]);
    const readable = fs.createReadStream(path);
    const properties = {};
    if (wh) {
        properties['width'] = wh[0];
        properties['height'] = wh[1];
    }
    if (averageColor) {
        properties['average_color'] = averageColor;
    }
    return addToGridFS(detectedName, readable, mime, {
        user_id: user._id,
        folder_id: folder !== null ? folder._id : null,
        comment: comment,
        properties: properties
    });
};
/**
 * Add file to drive
 *
 * @param user User who wish to add file
 * @param file File path or readableStream
 * @param comment Comment
 * @param type File type
 * @param folderId Folder ID
 * @param force If set to true, forcibly upload the file even if there is a file with the same hash.
 * @return Object that represents added file
 */
exports.default = (user, file, ...args) => new Promise((resolve, reject) => {
    // Get file path
    new Promise((res, rej) => {
        if (typeof file === 'string') {
            res([file, false]);
            return;
        }
        if (typeof file === 'object' && typeof file.read === 'function') {
            tmpFile()
                .then(path => {
                const readable = file;
                const writable = fs.createWriteStream(path);
                readable
                    .on('error', rej)
                    .on('end', () => {
                    res([path, true]);
                })
                    .pipe(writable)
                    .on('error', rej);
            })
                .catch(rej);
        }
        rej(new Error('un-compatible file.'));
    })
        .then(([path, shouldCleanup]) => new Promise((res, rej) => {
        addFile(user, path, ...args)
            .then(file => {
            res(file);
            if (shouldCleanup) {
                fs.unlink(path, (e) => {
                    if (e)
                        log(e.stack);
                });
            }
        })
            .catch(rej);
    }))
        .then(file => {
        log(`drive file has been created ${file._id}`);
        resolve(file);
        drive_file_2.pack(file).then(serializedFile => {
            // Publish drive_file_created event
            event_1.default(user._id, 'drive_file_created', serializedFile);
            event_1.publishDriveStream(user._id, 'file_created', serializedFile);
            // Register to search database
            if (conf_1.default.elasticsearch.enable) {
                const es = require('../../db/elasticsearch');
                es.index({
                    index: 'misskey',
                    type: 'drive_file',
                    id: file._id.toString(),
                    body: {
                        name: file.name,
                        user_id: user._id.toString()
                    }
                });
            }
        });
    })
        .catch(reject);
});
