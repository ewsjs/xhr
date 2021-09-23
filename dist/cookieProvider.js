"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieProvider = void 0;
var request = require("request");
var Promise = require("bluebird");
var CookieProvider = /** @class */ (function () {
    function CookieProvider(username, password) {
        /**@internal */
        this.j = null;
        /**@internal */
        this.username = null;
        /**@internal */
        this.password = null;
        this.username = username || '';
        this.password = password || '';
    }
    Object.defineProperty(CookieProvider.prototype, "providerName", {
        // private cookies: string[] = [];
        get: function () {
            return "cookie";
        },
        enumerable: false,
        configurable: true
    });
    CookieProvider.prototype.preCall = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (options.headers["Authorization"]) {
                delete options.headers["Authorization"];
            }
            // if (!this.cookies || this.cookies.length < 1) {
            if (!_this.j) {
                if (!_this.j)
                    _this.j = request.jar();
                options.jar = _this.j;
                var parser = CookieProvider.parseString(options.url);
                var baseUrl = parser.scheme + "://" + parser.authority + "/CookieAuth.dll?Logon";
                var preauthOptions = Object.assign({}, options, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'curl=Z2F&flags=0&forcedownlevel=0&formdir=1&trusted=0&username=' + _this.username + '&password=' + _this.password,
                    url: baseUrl,
                    disableRedirects: true,
                });
                //obtaining cookies
                request(preauthOptions, function (error, response, body) {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(options);
                    }
                });
            }
            else {
                options.jar = _this.j;
                resolve(options);
            }
        });
    };
    /**@internal */
    CookieProvider.parseString = function (url) {
        var regex = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
        var parts = url.match(regex);
        return {
            scheme: parts[2],
            authority: parts[4],
            path: parts[5],
            query: parts[7],
            fragment: parts[9]
        };
    };
    return CookieProvider;
}());
exports.CookieProvider = CookieProvider;
