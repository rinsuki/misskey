"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const osUtils = require('os-utils');
const diskusage = require("diskusage");
const xev_1 = require("xev");
const ev = new xev_1.default();
/**
 * Report stats regularly
 */
function default_1() {
    setInterval(() => {
        osUtils.cpuUsage(cpuUsage => {
            const disk = diskusage.checkSync(os.platform() == 'win32' ? 'c:' : '/');
            ev.emit('stats', {
                cpu_usage: cpuUsage,
                mem: {
                    total: os.totalmem(),
                    free: os.freemem()
                },
                disk,
                os_uptime: os.uptime(),
                process_uptime: process.uptime()
            });
        });
    }, 1000);
}
exports.default = default_1;
