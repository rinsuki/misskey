"use strict";
/**
 * Replace fontawesome symbols
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fontawesome = require("@fortawesome/fontawesome");
const regular = require("@fortawesome/fontawesome-free-regular");
const solid = require("@fortawesome/fontawesome-free-solid");
const brands = require("@fortawesome/fontawesome-free-brands");
// Add icons
fontawesome.library.add(regular);
fontawesome.library.add(solid);
fontawesome.library.add(brands);
exports.pattern = /%fa:(.+?)%/g;
exports.replacement = (_, key) => {
    const args = key.split(' ');
    let prefix = 'fas';
    const classes = [];
    let transform = '';
    let name;
    args.forEach(arg => {
        if (arg == 'R' || arg == 'S' || arg == 'B') {
            prefix =
                arg == 'R' ? 'far' :
                    arg == 'S' ? 'fas' :
                        arg == 'B' ? 'fab' :
                            '';
        }
        else if (arg[0] == '.') {
            classes.push('fa-' + arg.substr(1));
        }
        else if (arg[0] == '-') {
            transform = arg.substr(1).split('|').join(' ');
        }
        else {
            name = arg;
        }
    });
    const icon = fontawesome.icon({ prefix, iconName: name }, {
        classes: classes
    });
    if (icon) {
        icon.transform = fontawesome.parse.transform(transform);
        return `<i data-fa class="${name}">${icon.html[0]}</i>`;
    }
    else {
        console.warn(`'${name}' not found in fa`);
        return '';
    }
};
exports.default = (src) => {
    return src.replace(exports.pattern, exports.replacement);
};
exports.fa = fontawesome;
