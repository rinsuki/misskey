"use strict";
/**
 * Core Server
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const http = require("http");
const https = require("https");
const cluster = require("cluster");
const express = require("express");
const morgan = require("morgan");
const accesses_1 = require("accesses");
const vhost = require("vhost");
const log_request_1 = require("./log-request");
const conf_1 = require("./conf");
/**
 * Init app
 */
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
// Log
if (conf_1.default.accesses && conf_1.default.accesses.enable) {
    const accesses = new accesses_1.default({
        appName: 'Misskey',
        port: conf_1.default.accesses.port
    });
    app.use(accesses.express);
}
app.use(morgan(process.env.NODE_ENV == 'production' ? 'combined' : 'dev', {
    // create a write stream (in append mode)
    stream: conf_1.default.accesslog ? fs.createWriteStream(conf_1.default.accesslog) : null
}));
app.use((req, res, next) => {
    log_request_1.default(req);
    next();
});
// Drop request when without 'Host' header
app.use((req, res, next) => {
    if (!req.headers['host']) {
        res.sendStatus(400);
    }
    else {
        next();
    }
});
/**
 * Register modules
 */
app.use(vhost(`api.${conf_1.default.host}`, require('./api/server')));
app.use(vhost(conf_1.default.secondary_host, require('./himasaku/server')));
app.use(vhost(`file.${conf_1.default.secondary_host}`, require('./file/server')));
app.use(require('./web/server'));
/**
 * Create server
 */
const server = (() => {
    if (conf_1.default.https) {
        const certs = {};
        Object.keys(conf_1.default.https).forEach(k => {
            certs[k] = fs.readFileSync(conf_1.default.https[k]);
        });
        return https.createServer(certs, app);
    }
    else {
        return http.createServer(app);
    }
})();
/**
 * Steaming
 */
require('./api/streaming')(server);
/**
 * Server listen
 */
server.listen(conf_1.default.port, () => {
    if (cluster.isWorker) {
        // Send a 'ready' message to parent process
        process.send('ready');
    }
});
/**
 * Export app for testing
 */
module.exports = app;
