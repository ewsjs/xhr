"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XhrApi = void 0;
var request = require("request");
var Promise = require("bluebird");
var utils_1 = require("./utils");
var ntlmProvider_1 = require("./ntlmProvider");
var cookieProvider_1 = require("./cookieProvider");
/**
 * this is alternate XHR Api for ews-javascript-api/ewsjs
 *
 * @export
 * @class XhrApi
 * @implements {IXHRApi}
 */
var XhrApi = /** @class */ (function () {
    function XhrApi(aucoro) {
        if (aucoro === void 0) { aucoro = false; }
        this.requestOptions = {};
        this.proxyConfig = {
            enabled: false,
            url: null,
            userName: null,
            password: null,
        };
        /**@internal */
        this.authProvider = null;
        if (typeof aucoro === 'object') {
            this.requestOptions = aucoro;
            this.allowUntrustedCertificate = !(typeof aucoro.rejectUnauthorized !== 'undefined' ? aucoro.rejectUnauthorized : true);
        }
        else {
            this.allowUntrustedCertificate = !!aucoro;
        }
    }
    Object.defineProperty(XhrApi.prototype, "apiName", {
        get: function () {
            var n = "request";
            if (this.proxyConfig.enabled = true) {
                n += ";proxy:yes";
            }
            if (this.authProvider) {
                n += ";auth:" + this.authProvider.providerName;
            }
            return "request";
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Enable use of Proxy server when using this XHR Api
     *
     * @param {string} url Proxy server url with port, usally http://server:8080 or https://server:port
     * @param {string} [proxyUserName=null] proxy server authentication username
     * @param {string} [proxyPassword=null] proxy server authentication password
     * @returns {XhrApi} returns instance for chaining
     * @memberof XhrApi
     */
    XhrApi.prototype.useProxy = function (url, proxyUserName, proxyPassword) {
        if (proxyUserName === void 0) { proxyUserName = null; }
        if (proxyPassword === void 0) { proxyPassword = null; }
        if (this.authProvider instanceof ntlmProvider_1.NtlmProvider) {
            throw new Error("NtlmProvider does not work with proxy (yet!)");
        }
        this.proxyConfig = { enabled: url !== null, url: url, userName: proxyUserName, password: proxyPassword };
        return this;
    };
    /**
     * use NTLM authentication method, supports Ntlm v2
     *
     * @param {string} username username for ntlm
     * @param {string} password password for ntlm
     * @returns {XhrApi} returns instance for chaining
     * @memberof XhrApi
     */
    XhrApi.prototype.useNtlmAuthentication = function (username, password) {
        if (this.proxyConfig.enabled === true) {
            throw new Error("NtlmProvider does not work with proxy (yet!)");
        }
        this.authProvider = new ntlmProvider_1.NtlmProvider(username, password);
        return this;
    };
    /**
     * use cookies authentication method, usually required when hosted behind ISA/TMG
     *
     * @param {string} username username for cookies auth
     * @param {string} password password for cookies auth
     * @returns {XhrApi} returns instance for chaining
     * @memberof XhrApi
     */
    XhrApi.prototype.useCookieAuthentication = function (username, password) {
        this.authProvider = new cookieProvider_1.CookieProvider(username, password);
        return this;
    };
    /**
     * set custom IProvider interface, needed for custom IProvider implementing custom precall method
     *
     * @param {IProvider} authProvider auth provider implementing IProvider interface
     * @memberof XhrApi
     */
    XhrApi.prototype.setAuthProvider = function (authProvider) {
        this.authProvider = authProvider;
    };
    XhrApi.prototype.xhr = function (xhroptions, progressDelegate) {
        var _this = this;
        //setup xhr for github.com/andris9/fetch options
        var options = {
            url: xhroptions.url,
            body: xhroptions.data,
            headers: xhroptions.headers,
            method: xhroptions.type,
            followRedirect: !!xhroptions.allowRedirect,
            //resolveWithFullResponse: true
        };
        options["rejectUnauthorized"] = !this.allowUntrustedCertificate;
        // if (this.allowUntrustedCertificate) {
        //     options["rejectUnauthorized"] = !this.allowUntrustedCertificate;
        // }
        var proxyStr = this.getProxyString();
        if (proxyStr) {
            options["proxy"] = proxyStr;
        }
        options = this.getOptions(options);
        return new Promise(function (resolve, reject) {
            var _promise = Promise.resolve(options);
            if (_this.authProvider) {
                _promise = _this.authProvider.preCall(options);
            }
            _promise.then(function (opt) {
                // console.log("in proxy");
                // console.log(opt);
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
                            resolve((0, utils_1.setupXhrResponse)(xhrResponse));
                        }
                        else {
                            reject((0, utils_1.setupXhrResponse)(xhrResponse));
                        }
                    }
                });
            }, function (reason) {
                reject((0, utils_1.setupXhrResponse)(reason));
            });
        });
    };
    XhrApi.prototype.xhrStream = function (xhroptions, progressDelegate) {
        var _this = this;
        //setup xhr for github.com/andris9/fetch options
        var options = {
            url: xhroptions.url,
            body: xhroptions.data,
            headers: xhroptions.headers,
            method: xhroptions.type,
            followRedirect: false,
        };
        options["rejectUnauthorized"] = !this.allowUntrustedCertificate;
        // if (this.allowUntrustedCertificate) {
        //     options["rejectUnauthorized"] = !this.allowUntrustedCertificate;
        // }
        var proxyStr = this.getProxyString();
        if (proxyStr) {
            options["proxy"] = proxyStr;
        }
        options = this.getOptions(options);
        return new Promise(function (resolve, reject) {
            var _promise = Promise.resolve(options);
            if (_this.authProvider) {
                _promise = _this.authProvider.preCall(options);
            }
            _promise.then(function (opt) {
                _this.stream = request(opt || options);
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
                reject((0, utils_1.setupXhrResponse)(reason));
            });
        });
    };
    XhrApi.prototype.disconnect = function () {
        if (this.stream) {
            try {
                this.stream.destroy();
            }
            catch (e) { }
        }
    };
    XhrApi.prototype.getProxyString = function () {
        if (this.proxyConfig.enabled) {
            var url = this.proxyConfig.url;
            if (this.proxyConfig.userName && this.proxyConfig.password) {
                var proxyParts = url.split("://");
                return (proxyParts[0] + "://" + encodeURIComponent(this.proxyConfig.userName) + ":" + encodeURIComponent(this.proxyConfig.password) + "@" + proxyParts[1]);
            }
            else {
                return url;
            }
        }
        return null;
    };
    XhrApi.prototype.getOptions = function (opts) {
        var headers = Object.assign({}, (XhrApi.defaultOptions || {}).headers, (this.requestOptions || {}).headers, (opts || {}).headers);
        return Object.assign({}, XhrApi.defaultOptions, this.requestOptions, opts, { headers: headers });
    };
    XhrApi.defaultOptions = {};
    return XhrApi;
}());
exports.XhrApi = XhrApi;
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
    reject((0, utils_1.setupXhrResponse)(xhrResponse));
}
