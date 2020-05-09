"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function cleanURL(url) {
    url = url.replace('://', '____').replace(/\//g, '__').replace(/\./g, '_____');
    if (url.includes('?')) {
        url = url.substring(0, url.indexOf('?'));
    }
    return url;
}
exports.cleanURL = cleanURL;
//# sourceMappingURL=Utils.js.map