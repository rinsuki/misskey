"use strict";
/**
 * Web Server
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const ms = require("ms");
// express modules
const express = require("express");
const bodyParser = require("body-parser");
const favicon = require("serve-favicon");
const compression = require("compression");
const vhost = require("vhost");
const conf_1 = require("../conf");
/**
 * Init app
 */
const app = express();
app.disable('x-powered-by');
app.use(vhost(`docs.${conf_1.default.host}`, require('./docs/server')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
    type: ['application/json', 'text/plain']
}));
app.use(compression());
/**
 * Initialize requests
 */
app.use((req, res, next) => {
    res.header('X-Frame-Options', 'DENY');
    next();
});
/**
 * Static assets
 */
app.use(favicon(`${__dirname}/assets/favicon.ico`));
app.get('/apple-touch-icon.png', (req, res) => res.sendFile(`${__dirname}/assets/apple-touch-icon.png`));
app.use('/assets', express.static(`${__dirname}/assets`, {
    maxAge: ms('7 days')
}));
app.use('/assets/*.js', (req, res) => res.sendFile(`${__dirname}/assets/404.js`));
app.use('/assets', (req, res) => {
    res.sendStatus(404);
});
app.use('/recover', (req, res) => res.sendFile(`${__dirname}/assets/recover.html`));
/**
 * ServiceWroker
 */
app.get(/^\/sw\.(.+?)\.js$/, (req, res) => res.sendFile(`${__dirname}/assets/sw.${req.params[0]}.js`));
/**
 * Manifest
 */
app.get('/manifest.json', (req, res) => res.sendFile(`${__dirname}/assets/manifest.json`));
/**
 * Common API
 */
app.get(/\/api:url/, require('./service/url-preview'));
/**
 * Routing
 */
app.get('*', (req, res) => {
    res.sendFile(path.resolve(`${__dirname}/app/base.html`), {
        maxAge: ms('7 days')
    });
});
module.exports = app;
