"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const license = fs.readFileSync(__dirname + '/../../../LICENSE', 'utf-8');
exports.license = license;
const licenseHtml = license
    .replace(/\r\n/g, '\n')
    .replace(/(.)\n(.)/g, '$1 $2')
    .replace(/(^|\n)(.*?)($|\n)/g, '<p>$2</p>');
exports.licenseHtml = licenseHtml;
