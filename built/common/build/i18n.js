"use strict";
/**
 * Replace i18n texts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const locales_1 = require("../../../locales");
class Replacer {
    constructor(lang) {
        this.pattern = /"%i18n:(.+?)%"|'%i18n:(.+?)%'|%i18n:(.+?)%/g;
        this.lang = lang;
        this.get = this.get.bind(this);
        this.replacement = this.replacement.bind(this);
    }
    get(key) {
        const texts = locales_1.default[this.lang];
        if (texts == null) {
            console.warn(`lang '${this.lang}' is not supported`);
            return key; // Fallback
        }
        let text = texts;
        // Check the key existance
        const error = key.split('.').some(k => {
            if (text.hasOwnProperty(k)) {
                text = text[k];
                return false;
            }
            else {
                return true;
            }
        });
        if (error) {
            console.warn(`key '${key}' not found in '${this.lang}'`);
            return key; // Fallback
        }
        else {
            return text;
        }
    }
    replacement(match, a, b, c) {
        const key = a || b || c;
        if (match[0] == '"') {
            return '"' + this.get(key).replace(/"/g, '\\"') + '"';
        }
        else if (match[0] == "'") {
            return '\'' + this.get(key).replace(/'/g, '\\\'') + '\'';
        }
        else {
            return this.get(key);
        }
    }
}
exports.default = Replacer;
