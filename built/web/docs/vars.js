"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const util = require("util");
const glob = require("glob");
const yaml = require("js-yaml");
const licenseChecker = require("license-checker");
const tmp = require("tmp");
const fa_1 = require("../../common/build/fa");
const conf_1 = require("../../conf");
const license_1 = require("../../common/build/license");
const constants = require('../../const.json');
async function default_1() {
    const vars = {};
    const endpoints = glob.sync('./src/web/docs/api/endpoints/**/*.yaml');
    vars['endpoints'] = endpoints.map(ep => {
        const _ep = yaml.safeLoad(fs.readFileSync(ep, 'utf-8'));
        return _ep.endpoint;
    });
    const entities = glob.sync('./src/web/docs/api/entities/**/*.yaml');
    vars['entities'] = entities.map(x => {
        const _x = yaml.safeLoad(fs.readFileSync(x, 'utf-8'));
        return _x.name;
    });
    const docs = glob.sync('./src/web/docs/**/*.*.pug');
    vars['docs'] = {};
    docs.forEach(x => {
        const [, name, lang] = x.match(/docs\/(.+?)\.(.+?)\.pug$/);
        if (vars['docs'][name] == null) {
            vars['docs'][name] = {
                name,
                title: {}
            };
        }
        vars['docs'][name]['title'][lang] = fs.readFileSync(x, 'utf-8').match(/^h1 (.+?)\r?\n/)[1];
    });
    vars['kebab'] = string => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
    vars['config'] = conf_1.default;
    vars['copyright'] = constants.copyright;
    vars['facss'] = fa_1.fa.dom.css();
    vars['license'] = license_1.licenseHtml;
    const tmpObj = tmp.fileSync();
    fs.writeFileSync(tmpObj.name, JSON.stringify({
        licenseText: ''
    }), 'utf-8');
    const dependencies = await util.promisify(licenseChecker.init).bind(licenseChecker)({
        start: __dirname + '/../../../',
        customPath: tmpObj.name
    });
    tmpObj.removeCallback();
    vars['dependencies'] = dependencies;
    return vars;
}
exports.default = default_1;
