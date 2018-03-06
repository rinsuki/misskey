"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xev_1 = require("xev");
const ev = new xev_1.default();
function homeStream(request, connection) {
    const onStats = stats => {
        connection.send(JSON.stringify({
            type: 'stats',
            body: stats
        }));
    };
    ev.addListener('stats', onStats);
    connection.on('close', () => {
        ev.removeListener('stats', onStats);
    });
}
exports.default = homeStream;
