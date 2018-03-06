"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xev_1 = require("xev");
const ev = new xev_1.default();
function homeStream(request, connection) {
    const onRequest = request => {
        connection.send(JSON.stringify({
            type: 'request',
            body: request
        }));
    };
    ev.addListener('request', onRequest);
    connection.on('close', () => {
        ev.removeListener('request', onRequest);
    });
}
exports.default = homeStream;
