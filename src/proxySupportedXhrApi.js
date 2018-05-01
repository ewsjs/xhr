"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var Promise = require("bluebird");
var utils_1 = require("./utils");
var proxySupportedXhrApi = /** @class */ (function () {
    function proxySupportedXhrApi(proxyUrl, proxyUserNameOrallowUntrustedCertificate, proxyPassword, allowUntrustedCertificate) {
        if (proxyUserNameOrallowUntrustedCertificate === void 0) { proxyUserNameOrallowUntrustedCertificate = false; }
        if (proxyPassword === void 0) { proxyPassword = null; }
        if (allowUntrustedCertificate === void 0) { allowUntrustedCertificate = false; }
        this.proxyUrl = null;
        this.proxyUser = null;
        this.proxyPassword = null;
        this.provider = null;
        this.proxyUrl = proxyUrl;
        if (typeof proxyUserNameOrallowUntrustedCertificate === 'string') {
            this.proxyUser = proxyUserNameOrallowUntrustedCertificate;
            this.proxyPassword = proxyPassword;
            this.allowUntrustedCertificate = allowUntrustedCertificate;
        }
        else {
            this.allowUntrustedCertificate = proxyUserNameOrallowUntrustedCertificate;
        }
    }
    Object.defineProperty(proxySupportedXhrApi.prototype, "apiName", {
        get: function () {
            return "proxy";
        },
        enumerable: true,
        configurable: true
    });
    proxySupportedXhrApi.prototype.SetProvider = function (provider) {
        this.provider = provider;
    };
    proxySupportedXhrApi.prototype.xhr = function (xhroptions, progressDelegate) {
        var _this = this;
        //setup xhr for github.com/andris9/fetch options
        var options = {
            url: xhroptions.url,
            body: xhroptions.data,
            headers: xhroptions.headers,
            method: xhroptions.type,
            followRedirect: false,
        };
        var proxyStr = this.getProxyString();
        if (proxyStr) {
            options["proxy"] = proxyStr;
        }
        options["rejectUnauthorized"] = !this.allowUntrustedCertificate;
        return new Promise(function (resolve, reject) {
            var _promise = Promise.resolve(options);
            if (_this.provider) {
                _promise = _this.provider.preCall(options);
            }
            _promise.then(function (opt) {
                console.log("in proxy");
                console.log(opt);
                request(opt || options, function (error, response, body) {
                    if (error) {
                        rejectWithError(reject, error);
                    }
                    else {
                        var xhrResponse = {
                            response: body ? body.toString() : '',
                            status: response.statusCode,
                            //redirectCount: meta.redirectCount,
                            headers: response.headers,
                            finalUrl: response.url,
                            responseType: '',
                            statusText: response.statusMessage,
                        };
                        if (xhrResponse.status === 200) {
                            resolve(utils_1.setupXhrResponse(xhrResponse));
                        }
                        else {
                            reject(utils_1.setupXhrResponse(xhrResponse));
                        }
                    }
                });
            }, function (reason) {
                reject(utils_1.setupXhrResponse(reason));
            });
        });
    };
    proxySupportedXhrApi.prototype.xhrStream = function (xhroptions, progressDelegate) {
        var _this = this;
        //setup xhr for github.com/andris9/fetch options
        var options = {
            url: xhroptions.url,
            body: xhroptions.data,
            headers: xhroptions.headers,
            method: xhroptions.type,
            followRedirect: false,
        };
        var proxyStr = this.getProxyString();
        if (proxyStr) {
            options["proxy"] = proxyStr;
        }
        options["rejectUnauthorized"] = !this.allowUntrustedCertificate;
        return new Promise(function (resolve, reject) {
            var _promise = Promise.resolve(options);
            if (_this.provider) {
                _promise = _this.provider.preCall(options);
            }
            _promise.then(function (opt) {
                _this.stream = request(options);
                _this.stream.on('response', function (response) {
                    // unmodified http.IncomingMessage object
                    progressDelegate({ type: "header", headers: response["headers"] });
                });
                _this.stream.on("data", function (chunk) {
                    // decompressed data as it is received
                    // console.log('decoded chunk: ' + chunk)
                    // console.log(chunk.toString());
                    progressDelegate({ type: "data", data: chunk.toString() });
                });
                _this.stream.on("end", function () {
                    progressDelegate({ type: "end" });
                    resolve();
                });
                _this.stream.on('error', function (error) {
                    progressDelegate({ type: "error", error: error });
                    _this.disconnect();
                    rejectWithError(reject, error);
                });
            }, function (reason) {
                reject(utils_1.setupXhrResponse(reason));
            });
        });
    };
    proxySupportedXhrApi.prototype.disconnect = function () {
        if (this.stream) {
            try {
                this.stream.destroy();
            }
            catch (e) { }
        }
    };
    proxySupportedXhrApi.prototype.getProxyString = function () {
        if (this.proxyUrl) {
            var str = this.proxyUrl;
            if (this.proxyUser && this.proxyPassword) {
                var proxyParts = this.proxyUrl.split("://");
                return (proxyParts[0] + "://" + this.proxyUser + ":" + this.proxyPassword + "@" + proxyParts[1]);
            }
            else {
                return this.proxyUrl;
            }
        }
        return null;
    };
    return proxySupportedXhrApi;
}());
exports.proxySupportedXhrApi = proxySupportedXhrApi;
function rejectWithError(reject, reason) {
    var xhrResponse = {
        response: reason.response && reason.response.body ? reason.response.body.toString() : '',
        status: reason.statusCode,
        //redirectCount: meta.redirectCount,
        headers: reason.response ? reason.response.headers : {},
        finalUrl: reason.url,
        responseType: '',
        statusText: reason.message,
        message: reason.message
    };
    if (typeof xhrResponse.status === 'undefined' && reason.message) {
        try {
            var parse = reason.message.match(/statusCode=(\d*?)$/);
            if (parse && parse.length > 1) {
                xhrResponse["status"] = Number(parse[1]);
            }
        }
        catch (e) { }
    }
    reject(utils_1.setupXhrResponse(xhrResponse));
}
