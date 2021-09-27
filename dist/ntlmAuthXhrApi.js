"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ntlmAuthXhrApi = void 0;
var fetch_1 = require("fetch");
var Promise = require("bluebird");
var ntlm_client_1 = require("@ewsjs/ntlm-client");
var https_1 = require("https");
var http_1 = require("http");
var utils_1 = require("./utils");
var ntlmAuthXhrApi = /** @class */ (function () {
    function ntlmAuthXhrApi(username, password, allowUntrustedCertificate) {
        if (allowUntrustedCertificate === void 0) { allowUntrustedCertificate = false; }
        this.stream = null;
        this.username = null;
        this.password = null;
        this.domain = '';
        this.username = username || '';
        this.password = password || '';
        this.allowUntrustedCertificate = allowUntrustedCertificate;
        if (username.indexOf("\\") > 0) {
            this.username = username.split("\\")[1];
            this.domain = username.split("\\")[0].toUpperCase();
        }
    }
    Object.defineProperty(ntlmAuthXhrApi.prototype, "apiName", {
        get: function () {
            return "ntlm";
        },
        enumerable: false,
        configurable: true
    });
    ntlmAuthXhrApi.prototype.xhr = function (xhroptions, progressDelegate) {
        var _this = this;
        //setup xhr for github.com/andris9/fetch options
        var options = {
            url: xhroptions.url,
            //payload: xhroptions.data,
            headers: xhroptions.headers,
            method: 'GET',
            agentHttps: new https_1.Agent({ keepAlive: true, rejectUnauthorized: !this.allowUntrustedCertificate }),
            agentHttp: new http_1.Agent({ keepAlive: true }) //keepaliveAgent
        };
        return new Promise(function (resolve, reject) {
            _this.ntlmPreCall(options).then(function (optionsWithNtlmHeader) {
                optionsWithNtlmHeader['payload'] = xhroptions.data;
                optionsWithNtlmHeader['method'] = xhroptions.type;
                fetch_1.fetchUrl(xhroptions.url, optionsWithNtlmHeader, function (error, meta, body) {
                    if (error) {
                        reject(error);
                    }
                    else {
                        var xhrResponse = {
                            response: body.toString(),
                            status: meta.status,
                            redirectCount: meta.redirectCount,
                            headers: meta.responseHeaders,
                            finalUrl: meta.finalUrl,
                            responseType: '',
                            statusText: undefined,
                        };
                        if (xhrResponse.status === 200) {
                            resolve(utils_1.setupXhrResponse(xhrResponse));
                        }
                        else {
                            reject(utils_1.setupXhrResponse(xhrResponse));
                        }
                    }
                });
            }, reject);
        });
    };
    ntlmAuthXhrApi.prototype.xhrStream = function (xhroptions, progressDelegate) {
        var _this = this;
        //setup xhr for github.com/andris9/fetch options
        var options = {
            url: xhroptions.url,
            //payload: xhroptions.data,
            headers: xhroptions.headers,
            method: 'GET',
            agentHttps: new https_1.Agent({ keepAlive: true, rejectUnauthorized: !this.allowUntrustedCertificate }),
            agentHttp: new http_1.Agent({ keepAlive: true }) //keepaliveAgent
        };
        return new Promise(function (resolve, reject) {
            _this.ntlmPreCall(options).then(function (optionsWithNtlmHeader) {
                optionsWithNtlmHeader['payload'] = xhroptions.data;
                optionsWithNtlmHeader['method'] = xhroptions.type;
                _this.stream = new fetch_1.FetchStream(xhroptions.url, optionsWithNtlmHeader);
                _this.stream.on("data", function (chunk) {
                    //console.log(chunk.toString());
                    progressDelegate({ type: "data", data: chunk.toString() });
                });
                _this.stream.on("meta", function (meta) {
                    progressDelegate({ type: "header", headers: meta["responseHeaders"] });
                });
                _this.stream.on("end", function () {
                    progressDelegate({ type: "end" });
                    resolve();
                });
                _this.stream.on('error', function (error) {
                    progressDelegate({ type: "error", error: error });
                    _this.disconnect();
                    reject(error);
                });
            }, reject);
        });
    };
    ntlmAuthXhrApi.prototype.disconnect = function () {
        if (this.stream) {
            try {
                this.stream.destroy();
            }
            catch (e) { }
        }
    };
    ntlmAuthXhrApi.prototype.ntlmPreCall = function (options) {
        var ntlmOptions = {
            url: options.url,
            username: this.username,
            password: this.password,
            workstation: options['workstation'] || '',
            domain: this.domain
        };
        return new Promise(function (resolve, reject) {
            var type1msg = ntlm_client_1.createType1Message(ntlmOptions.workstation, ntlmOptions.domain);
            options.headers['Authorization'] = type1msg;
            options.headers['Connection'] = 'keep-alive';
            fetch_1.fetchUrl(options.url, options, function (error, meta, body) {
                if (error) {
                    reject(error);
                }
                else {
                    var xhrResponse = {
                        response: body,
                        status: meta.status,
                        redirectCount: meta.redirectCount,
                        headers: meta.responseHeaders,
                        finalUrl: meta.finalUrl,
                        responseType: '',
                        statusText: undefined,
                    };
                    resolve(xhrResponse);
                }
            });
        }).then(function (res) {
            if (!res.headers['www-authenticate'])
                throw new Error('www-authenticate not found on response of second request');
            var type2msg = ntlm_client_1.decodeType2Message(res.headers['www-authenticate']);
            var type3msg = ntlm_client_1.createType3Message(type2msg, ntlmOptions.username, ntlmOptions.password, ntlmOptions.workstation, ntlmOptions.domain); //with ntlm-client
            delete options.headers['authorization']; // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails
            delete options.headers['connection']; // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails
            options.headers['Authorization'] = type3msg;
            options.headers['Connection'] = 'Close';
            return options;
        });
    };
    return ntlmAuthXhrApi;
}());
exports.ntlmAuthXhrApi = ntlmAuthXhrApi;
