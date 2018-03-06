"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const proxyAddr = require("proxy-addr");
const xev_1 = require("xev");
const ev = new xev_1.default();
function default_1(req) {
    const ip = proxyAddr(req, () => true);
    const md5 = crypto.createHash('md5');
    md5.update(ip);
    const hashedIp = md5.digest('hex').substr(0, 3);
    ev.emit('request', {
        ip: hashedIp,
        method: req.method,
        hostname: req.hostname,
        path: req.originalUrl
    });
}
exports.default = default_1;
