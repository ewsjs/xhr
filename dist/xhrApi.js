"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XhrApi = void 0;
const https = require("https");
const axios_1 = require("axios");
const utils_1 = require("./utils");
const ntlmProvider_1 = require("./ntlmProvider");
const cookieProvider_1 = require("./cookieProvider");
/**
 * this is alternate XHR Api for ews-javascript-api/ewsjs
 *
 * @export
 * @class XhrApi
 * @implements {IXHRApi}
 */
class XhrApi {
    get apiName() {
        let n = "request";
        if (this.proxyConfig.enabled) {
            n += ";proxy:yes";
        }
        if (this.authProvider) {
            n += ";auth:" + this.authProvider.providerName;
        }
        return n;
    }
    constructor(aucoro = false) {
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
    /**
     * Enable use of Proxy server when using this XHR Api
     *
     * @param {string} url Proxy server url with port, usally http://server:8080 or https://server:port
     * @param {string} [proxyUserName=null] proxy server authentication username
     * @param {string} [proxyPassword=null] proxy server authentication password
     * @returns {XhrApi} returns instance for chaining
     * @memberof XhrApi
     */
    useProxy(url, proxyUserName = null, proxyPassword = null) {
        if (this.authProvider instanceof ntlmProvider_1.NtlmProvider) {
            throw new Error("NtlmProvider does not work with proxy (yet!)");
        }
        this.proxyConfig = { enabled: url !== null, url: url, userName: proxyUserName, password: proxyPassword };
        return this;
    }
    /**
     * use NTLM authentication method, supports Ntlm v2
     *
     * @param {string} username username for ntlm
     * @param {string} password password for ntlm
     * @returns {XhrApi} returns instance for chaining
     * @memberof XhrApi
     */
    useNtlmAuthentication(username, password) {
        if (this.proxyConfig.enabled === true) {
            throw new Error("NtlmProvider does not work with proxy (yet!)");
        }
        this.authProvider = new ntlmProvider_1.NtlmProvider(username, password);
        return this;
    }
    /**
     * use cookies authentication method, usually required when hosted behind ISA/TMG
     *
     * @param {string} username username for cookies auth
     * @param {string} password password for cookies auth
     * @returns {XhrApi} returns instance for chaining
     * @memberof XhrApi
     */
    useCookieAuthentication(username, password) {
        this.authProvider = new cookieProvider_1.CookieProvider(username, password);
        return this;
    }
    /**
     * set custom IProvider interface, needed for custom IProvider implementing custom precall method
     *
     * @param {IProvider} authProvider auth provider implementing IProvider interface
     * @memberof XhrApi
     */
    setAuthProvider(authProvider) {
        this.authProvider = authProvider;
    }
    async xhr(xhroptions, progressDelegate) {
        let client = axios_1.default.create();
        //setup xhr for github.com/andris9/fetch options
        let options = {
            url: xhroptions.url,
            data: xhroptions.data,
            headers: xhroptions.headers,
            method: xhroptions.type,
            maxRedirects: !xhroptions.allowRedirect ? 0 : 5,
            //resolveWithFullResponse: true
            responseType: 'text',
            validateStatus: () => true, // need this to be processed by ews not axios.
        };
        if (this.allowUntrustedCertificate) {
            options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
        }
        let proxyConfig = this.getProxyOption();
        if (proxyConfig) {
            options["proxy"] = proxyConfig;
        }
        options = this.getOptions(options);
        let _promise = Promise.resolve(options);
        try {
            if (this.authProvider) {
                _promise = this.authProvider.preCall({ ...options, rejectUnauthorized: !this.allowUntrustedCertificate });
                client = this.authProvider.client || client;
            }
            const opt = await _promise;
            // console.log({ opt });
            const response = await client(opt || options);
            // if (error) {
            //   rejectWithError(reject, error);
            // }
            let xhrResponse = {
                response: response.data ? response.data.toString() : '',
                status: response.status,
                //redirectCount: meta.redirectCount,
                headers: response.headers,
                finalUrl: response.headers.location || response.request.res.responseUrl,
                responseType: '',
                statusText: response.statusText,
            };
            if (xhrResponse.status === 200) {
                return (0, utils_1.setupXhrResponse)(xhrResponse);
            }
            else {
                throw xhrResponse;
            }
        }
        catch (error) {
            throw (0, utils_1.setupXhrResponse)(error);
        }
    }
    xhrStream(xhroptions, progressDelegate) {
        let client = axios_1.default.create();
        //setup xhr for github.com/andris9/fetch options
        let options = {
            url: xhroptions.url,
            data: xhroptions.data,
            headers: xhroptions.headers,
            method: xhroptions.type,
            maxRedirects: !xhroptions.allowRedirect ? 0 : 5,
            responseType: 'stream',
        };
        if (this.allowUntrustedCertificate) {
            options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
        }
        let proxyConfig = this.getProxyOption();
        if (proxyConfig) {
            options["proxy"] = proxyConfig;
        }
        options = this.getOptions(options);
        return new Promise((resolve, reject) => {
            let _promise = Promise.resolve(options);
            if (this.authProvider) {
                _promise = this.authProvider.preCall({ ...options, rejectUnauthorized: !this.allowUntrustedCertificate });
                client = this.authProvider.client || client;
            }
            _promise.then(async (opt) => {
                const response = await client(opt || options);
                this.stream = response.data;
                this.stream.on('response', function (response) {
                    // unmodified http.IncomingMessage object
                    progressDelegate({ type: "header", headers: response["headers"] });
                });
                this.stream.on("data", (chunk) => {
                    // decompressed data as it is received
                    // console.log('decoded chunk: ' + chunk)
                    // console.log(chunk.toString());
                    progressDelegate({ type: "data", data: chunk.toString() });
                });
                this.stream.on("end", () => {
                    progressDelegate({ type: "end" });
                    resolve(null);
                });
                this.stream.on('error', (error) => {
                    progressDelegate({ type: "error", error: error });
                    this.disconnect();
                    rejectWithError(reject, error);
                });
            }, reason => {
                reject((0, utils_1.setupXhrResponse)(reason));
            });
        });
    }
    disconnect() {
        if (this.stream) {
            try {
                this.stream.destroy();
            }
            catch (e) { }
        }
    }
    getProxyString() {
        if (this.proxyConfig.enabled) {
            let url = this.proxyConfig.url;
            if (this.proxyConfig.userName && this.proxyConfig.password) {
                let proxyParts = url.split("://");
                return (proxyParts[0] + "://" + encodeURIComponent(this.proxyConfig.userName) + ":" + encodeURIComponent(this.proxyConfig.password) + "@" + proxyParts[1]);
            }
            else {
                return url;
            }
        }
        return null;
    }
    getProxyOption() {
        if (this.proxyConfig.enabled) {
            let url = this.proxyConfig.url;
            let proxyParts = new URL(url);
            if (this.proxyConfig.userName && this.proxyConfig.password) {
                return {
                    protocol: proxyParts.protocol,
                    host: proxyParts.hostname,
                    port: proxyParts.port ? Number(proxyParts.port) : 80,
                    auth: {
                        username: this.proxyConfig.userName,
                        password: this.proxyConfig.password
                    }
                };
            }
            else {
                return {
                    protocol: proxyParts.protocol,
                    host: proxyParts.hostname,
                    port: proxyParts.port ? Number(proxyParts.port) : 80,
                };
            }
        }
        return null;
    }
    getOptions(opts) {
        let headers = Object.assign({}, (XhrApi.defaultOptions || {}).headers, (this.requestOptions || {}).headers, (opts || {}).headers);
        return Object.assign({}, XhrApi.defaultOptions, this.requestOptions, opts, { headers });
    }
}
exports.XhrApi = XhrApi;
XhrApi.defaultOptions = {};
function rejectWithError(reject, reason) {
    let xhrResponse = {
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
            let parse = reason.message.match(/statusCode=(\d*?)$/);
            if (parse && parse.length > 1) {
                xhrResponse["status"] = Number(parse[1]);
            }
        }
        catch (e) { }
    }
    reject((0, utils_1.setupXhrResponse)(xhrResponse));
}
