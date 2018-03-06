"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rndstr_1 = require("rndstr");
exports.default = () => `!${rndstr_1.default('a-zA-Z0-9', 32)}`;
