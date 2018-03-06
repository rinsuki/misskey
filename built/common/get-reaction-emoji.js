"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(reaction) {
    switch (reaction) {
        case 'like': return '👍';
        case 'love': return '❤️';
        case 'laugh': return '😆';
        case 'hmm': return '🤔';
        case 'surprise': return '😮';
        case 'congrats': return '🎉';
        case 'angry': return '💢';
        case 'confused': return '😥';
        case 'pudding': return '🍮';
        default: return '';
    }
}
exports.default = default_1;
