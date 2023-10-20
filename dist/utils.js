"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupXhrResponse = void 0;
/** @internal */
function setupXhrResponse(xhrResponse) {
    xhrResponse['responseText'] = xhrResponse['response'];
    delete xhrResponse['response'];
    xhrResponse.getAllResponseHeaders = function () {
        let header = '';
        if (xhrResponse.headers) {
            for (const key in xhrResponse.headers) {
                header += `${key} : ${xhrResponse.headers[key]}\r\n`;
            }
        }
        return header;
    };
    xhrResponse.getResponseHeader = (header) => {
        if (header) {
            if (xhrResponse.headers) {
                if (xhrResponse.headers[header]) {
                    return xhrResponse.headers[header];
                }
                if (xhrResponse.headers[header.toLocaleLowerCase()]) {
                    return xhrResponse.headers[header.toLocaleLowerCase()];
                }
            }
        }
        return null;
    };
    return xhrResponse;
}
exports.setupXhrResponse = setupXhrResponse;
