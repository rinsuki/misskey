"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = require("mongodb");
const deepcopy = require("deepcopy");
const user_1 = require("./user");
const drive_file_1 = require("./drive-file");
const mongodb_1 = require("../../db/mongodb");
const text_1 = require("../common/text");
const MessagingMessage = mongodb_1.default.get('messaging_messages');
exports.default = MessagingMessage;
function isValidText(text) {
    return text.length <= 1000 && text.trim() != '';
}
exports.isValidText = isValidText;
/**
 * Pack a messaging message for API response
 *
 * @param {any} message
 * @param {any} me?
 * @param {any} options?
 * @return {Promise<any>}
 */
exports.pack = (message, me, options) => new Promise(async (resolve, reject) => {
    const opts = options || {
        populateRecipient: true
    };
    let _message;
    // Populate the message if 'message' is ID
    if (mongo.ObjectID.prototype.isPrototypeOf(message)) {
        _message = await MessagingMessage.findOne({
            _id: message
        });
    }
    else if (typeof message === 'string') {
        _message = await MessagingMessage.findOne({
            _id: new mongo.ObjectID(message)
        });
    }
    else {
        _message = deepcopy(message);
    }
    // Rename _id to id
    _message.id = _message._id;
    delete _message._id;
    // Parse text
    if (_message.text) {
        _message.ast = text_1.default(_message.text);
    }
    // Populate user
    _message.user = await user_1.pack(_message.user_id, me);
    if (_message.file_id) {
        // Populate file
        _message.file = await drive_file_1.pack(_message.file_id);
    }
    if (opts.populateRecipient) {
        // Populate recipient
        _message.recipient = await user_1.pack(_message.recipient_id, me);
    }
    resolve(_message);
});
