"use strict";
/**
 * Misskey Entry Point!
 */
Object.defineProperty(exports, "__esModule", { value: true });
Error.stackTraceLimit = Infinity;
const fs = require("fs");
const os = require("os");
const cluster = require("cluster");
const debug = require("debug");
const chalk_1 = require("chalk");
// import portUsed = require('tcp-port-used');
const isRoot = require("is-root");
const accesses_1 = require("accesses");
const xev_1 = require("xev");
const logger_1 = require("./utils/logger");
const progressbar_1 = require("./utils/cli/progressbar");
const environmentInfo_1 = require("./utils/environmentInfo");
const machineInfo_1 = require("./utils/machineInfo");
const dependencyInfo_1 = require("./utils/dependencyInfo");
const stats_1 = require("./utils/stats");
const config_1 = require("./config");
const config_2 = require("./config");
const clusterLog = debug('misskey:cluster');
const ev = new xev_1.default();
process.title = 'Misskey';
// Start app
main();
/**
 * Init process
 */
function main() {
    if (cluster.isMaster) {
        masterMain();
        ev.mount();
        stats_1.default();
    }
    else {
        workerMain();
    }
}
/**
 * Init master process
 */
async function masterMain() {
    let config;
    try {
        // initialize app
        config = await init();
    }
    catch (e) {
        console.error(e);
        logger_1.default.error(chalk_1.default.red('Fatal error occurred during initializing :('));
        process.exit(1);
    }
    logger_1.default.info(chalk_1.default.green('Successfully initialized :)'));
    // Init accesses
    if (config.accesses && config.accesses.enable) {
        accesses_1.master();
    }
    spawnWorkers(() => {
        logger_1.default.info(chalk_1.default.bold.green(`Now listening on port ${chalk_1.default.underline(config.port.toString())}`));
        logger_1.default.info(chalk_1.default.bold.green(config.url));
    });
}
/**
 * Init worker process
 */
function workerMain() {
    // start server
    require('./server');
}
/**
 * Init app
 */
async function init() {
    logger_1.default.info('Welcome to Misskey!');
    logger_1.default.info(chalk_1.default.bold('Misskey <aoi>'));
    logger_1.default.info('Initializing...');
    environmentInfo_1.default.show();
    machineInfo_1.default.show();
    new dependencyInfo_1.default().showAll();
    const configLogger = new logger_1.default('Config');
    if (!fs.existsSync(config_1.path)) {
        throw 'Configuration not found - Please run "npm run config" command.';
    }
    const config = config_2.default();
    configLogger.info('Successfully loaded');
    configLogger.info(`maintainer: ${config.maintainer}`);
    if (process.platform === 'linux' && !isRoot() && config.port < 1024) {
        throw 'You need root privileges to listen on port below 1024 on Linux';
    }
    // Check if a port is being used
    /* https://github.com/stdarg/tcp-port-used/issues/3
    if (await portUsed.check(config.port)) {
        throw `Port ${config.port} is already used`;
    }
    */
    // Try to connect to MongoDB
    const mongoDBLogger = new logger_1.default('MongoDB');
    const db = require('./db/mongodb').default;
    mongoDBLogger.info('Successfully connected');
    db.close();
    return config;
}
function spawnWorkers(onComplete) {
    // Count the machine's CPUs
    const cpuCount = os.cpus().length;
    const progress = new progressbar_1.default(cpuCount, 'Starting workers');
    // Create a worker for each CPU
    for (let i = 0; i < cpuCount; i++) {
        const worker = cluster.fork();
        worker.on('message', message => {
            if (message === 'ready') {
                progress.increment();
            }
        });
    }
    // On all workers started
    progress.on('complete', () => {
        onComplete();
    });
}
// Listen new workers
cluster.on('fork', worker => {
    clusterLog(`Process forked: [${worker.id}]`);
});
// Listen online workers
cluster.on('online', worker => {
    clusterLog(`Process is now online: [${worker.id}]`);
});
// Listen for dying workers
cluster.on('exit', worker => {
    // Replace the dead worker,
    // we're not sentimental
    clusterLog(chalk_1.default.red(`[${worker.id}] died :(`));
    cluster.fork();
});
// Display detail of unhandled promise rejection
process.on('unhandledRejection', console.dir);
// Dying away...
process.on('exit', () => {
    logger_1.default.info('The process is going exit');
});
