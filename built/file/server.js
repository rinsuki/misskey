"use strict";
/**
 * File Server
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongodb = require("mongodb");
const _gm = require("gm");
const drive_file_1 = require("../api/models/drive-file");
const gm = _gm.subClass({
    imageMagick: true
});
/**
 * Init app
 */
const app = express();
app.disable('x-powered-by');
app.locals.cache = true;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
/**
 * Statics
 */
app.use('/assets', express.static(`${__dirname}/assets`, {
    maxAge: 1000 * 60 * 60 * 24 * 365 // 一年
}));
app.get('/', (req, res) => {
    res.send('yee haw');
});
app.get('/default-avatar.jpg', (req, res) => {
    const file = fs.createReadStream(`${__dirname}/assets/avatar.jpg`);
    send(file, 'image/jpeg', req, res);
});
app.get('/app-default.jpg', (req, res) => {
    const file = fs.createReadStream(`${__dirname}/assets/dummy.png`);
    send(file, 'image/png', req, res);
});
function thumbnail(data, type, resize) {
    const readable = (() => {
        // 画像ではない場合
        if (!/^image\/.*$/.test(type)) {
            // 使わないことにしたストリームはしっかり取り壊しておく
            data.destroy();
            return fs.createReadStream(`${__dirname}/assets/not-an-image.png`);
        }
        const imageType = type.split('/')[1];
        // 画像でもPNGかJPEGでないならダメ
        if (imageType != 'png' && imageType != 'jpeg') {
            // 使わないことにしたストリームはしっかり取り壊しておく
            data.destroy();
            return fs.createReadStream(`${__dirname}/assets/thumbnail-not-available.png`);
        }
        return data;
    })();
    let g = gm(readable);
    if (resize) {
        g = g.resize(resize, resize);
    }
    const stream = g
        .compress('jpeg')
        .quality(80)
        .interlace('line')
        .noProfile() // Remove EXIF
        .stream();
    return {
        contentType: 'image/jpeg',
        stream
    };
}
const commonReadableHandlerGenerator = (req, res) => (e) => {
    console.dir(e);
    req.destroy();
    res.destroy(e);
};
function send(readable, type, req, res) {
    readable.on('error', commonReadableHandlerGenerator(req, res));
    const data = (() => {
        if (req.query.thumbnail !== undefined) {
            return thumbnail(readable, type, req.query.size);
        }
        return {
            contentType: type,
            stream: readable
        };
    })();
    if (readable !== data.stream) {
        data.stream.on('error', commonReadableHandlerGenerator(req, res));
    }
    if (req.query.download !== undefined) {
        res.header('Content-Disposition', 'attachment');
    }
    res.header('Content-Type', data.contentType);
    data.stream.pipe(res);
    data.stream.on('end', () => {
        res.end();
    });
}
async function sendFileById(req, res) {
    // Validate id
    if (!mongodb.ObjectID.isValid(req.params.id)) {
        res.status(400).send('incorrect id');
        return;
    }
    const fileId = new mongodb.ObjectID(req.params.id);
    // Fetch (drive) file
    const file = await drive_file_1.default.findOne({ _id: fileId });
    // validate name
    if (req.params.name !== undefined && req.params.name !== file.filename) {
        res.status(404).send('there is no file has given name');
        return;
    }
    if (file == null) {
        res.status(404).sendFile(`${__dirname}/assets/dummy.png`);
        return;
    }
    const bucket = await drive_file_1.getGridFSBucket();
    const readable = bucket.openDownloadStream(fileId);
    send(readable, file.contentType, req, res);
}
/**
 * Routing
 */
app.get('/:id', sendFileById);
app.get('/:id/:name', sendFileById);
module.exports = app;
