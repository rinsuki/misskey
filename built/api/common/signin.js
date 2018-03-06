"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const conf_1 = require("../../conf");
function default_1(res, user, redirect) {
    const expires = 1000 * 60 * 60 * 24 * 365; // One Year
    res.cookie('i', user.token, {
        path: '/',
        domain: `.${conf_1.default.host}`,
        secure: conf_1.default.url.substr(0, 5) === 'https',
        httpOnly: false,
        expires: new Date(Date.now() + expires),
        maxAge: expires
    });
    if (redirect) {
        res.redirect(conf_1.default.url);
    }
    else {
        res.sendStatus(204);
    }
}
exports.default = default_1;
