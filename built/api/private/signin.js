"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const user_1 = require("../models/user");
const signin_1 = require("../models/signin");
const event_1 = require("../event");
const signin_2 = require("../common/signin");
const conf_1 = require("../../conf");
exports.default = async (req, res) => {
    res.header('Access-Control-Allow-Origin', conf_1.default.url);
    res.header('Access-Control-Allow-Credentials', 'true');
    const username = req.body['username'];
    const password = req.body['password'];
    const token = req.body['token'];
    if (typeof username != 'string') {
        res.sendStatus(400);
        return;
    }
    if (typeof password != 'string') {
        res.sendStatus(400);
        return;
    }
    if (token != null && typeof token != 'string') {
        res.sendStatus(400);
        return;
    }
    // Fetch user
    const user = await user_1.default.findOne({
        username_lower: username.toLowerCase()
    }, {
        fields: {
            data: false,
            profile: false
        }
    });
    if (user === null) {
        res.status(404).send({
            error: 'user not found'
        });
        return;
    }
    // Compare password
    const same = await bcrypt.compare(password, user.password);
    if (same) {
        if (user.two_factor_enabled) {
            const verified = speakeasy.totp.verify({
                secret: user.two_factor_secret,
                encoding: 'base32',
                token: token
            });
            if (verified) {
                signin_2.default(res, user, false);
            }
            else {
                res.status(400).send({
                    error: 'invalid token'
                });
            }
        }
        else {
            signin_2.default(res, user, false);
        }
    }
    else {
        res.status(400).send({
            error: 'incorrect password'
        });
    }
    // Append signin history
    const record = await signin_1.default.insert({
        created_at: new Date(),
        user_id: user._id,
        ip: req.ip,
        headers: req.headers,
        success: same
    });
    // Publish signin event
    event_1.default(user._id, 'signin', await signin_1.pack(record));
};
