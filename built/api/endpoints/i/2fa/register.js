"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const cafy_1 = require("cafy");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const user_1 = require("../../../models/user");
const conf_1 = require("../../../../conf");
module.exports = async (params, user) => new Promise(async (res, rej) => {
    // Get 'password' parameter
    const [password, passwordErr] = cafy_1.default(params.password).string().$;
    if (passwordErr)
        return rej('invalid password param');
    // Compare password
    const same = await bcrypt.compare(password, user.password);
    if (!same) {
        return rej('incorrect password');
    }
    // Generate user's secret key
    const secret = speakeasy.generateSecret({
        length: 32
    });
    await user_1.default.update(user._id, {
        $set: {
            two_factor_temp_secret: secret.base32
        }
    });
    // Get the data URL of the authenticator URL
    QRCode.toDataURL(speakeasy.otpauthURL({
        secret: secret.base32,
        encoding: 'base32',
        label: user.username,
        issuer: conf_1.default.host
    }), (err, data_url) => {
        res({
            qr: data_url,
            secret: secret.base32,
            label: user.username,
            issuer: conf_1.default.host
        });
    });
});
