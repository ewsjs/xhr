"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieProvider = void 0;
const axios_1 = require("axios");
const http_1 = require("http-cookie-agent/http");
const tough_cookie_1 = require("tough-cookie");
class CookieProvider {
    // private cookies: string[] = []
    get providerName() {
        return 'cookie';
    }
    constructor(username, password) {
        this._client = null;
        /**@internal */
        this.jar = null;
        /**@internal */
        this.username = null;
        /**@internal */
        this.password = null;
        this.username = username || '';
        this.password = password || '';
    }
    get client() {
        return this._client;
    }
    async preCall(options) {
        if (options.headers['Authorization']) {
            delete options.headers['Authorization'];
        }
        if (!this.jar) {
            this.jar = new tough_cookie_1.CookieJar();
            this._client = axios_1.default.create({
                httpAgent: new http_1.HttpCookieAgent({ cookies: { jar: this.jar } }),
                httpsAgent: new http_1.HttpsCookieAgent({ cookies: { jar: this.jar }, rejectUnauthorized: options.rejectUnauthorized }),
            });
            const parser = CookieProvider.parseString(options.url);
            const baseUrl = `${parser.scheme}://${parser.authority}/CookieAuth.dll?Logon`;
            const preauthOptions = Object.assign({}, options, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: `curl=Z2F&flags=0&forcedownlevel=0&formdir=1&trusted=0&username=${this.username}&password=${this.password}`,
                url: baseUrl,
                maxRedirects: 0,
            });
            try {
                await this.client(preauthOptions);
                return options;
            }
            catch (error) {
                throw error;
            }
        }
        else {
            if (!this._client)
                this._client = axios_1.default.create({
                    httpAgent: new http_1.HttpCookieAgent({ cookies: { jar: this.jar } }),
                    httpsAgent: new http_1.HttpsCookieAgent({ cookies: { jar: this.jar }, rejectUnauthorized: options.rejectUnauthorized }),
                });
            return options;
        }
    }
    /**@internal */
    static parseString(url) {
        const regex = RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?');
        const parts = url.match(regex);
        return {
            scheme: parts[2],
            authority: parts[4],
            path: parts[5],
            query: parts[7],
            fragment: parts[9]
        };
    }
}
exports.CookieProvider = CookieProvider;
