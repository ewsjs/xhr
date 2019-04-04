"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var Promise = require("bluebird");
var https_1 = require("https");
var _a = require("ntlm-client"), createType1Message = _a.createType1Message, decodeType2Message = _a.decodeType2Message, createType3Message = _a.createType3Message; //ref: has NTLM v2 support // info: also possible to use this package in node.
var NtlmProvider = /** @class */ (function () {
    function NtlmProvider(username, password) {
        this.username = null;
        this.password = null;
        this.domain = '';
        this.username = username || '';
        this.password = password || '';
        if (username.indexOf("\\") > 0) {
            this.username = username.split("\\")[1];
            this.domain = username.split("\\")[0].toUpperCase();
        }
    }
    Object.defineProperty(NtlmProvider.prototype, "providerName", {
        get: function () {
            return "ntlm";
        },
        enumerable: true,
        configurable: true
    });
    NtlmProvider.prototype.preCall = function (options) {
        var ntlmOptions = {
            url: options.url,
            username: this.username,
            password: this.password,
            workstation: options['workstation'] || '.',
            domain: this.domain,
        };
        return new Promise(function (resolve, reject) {
            options.headers['Connection'] = 'keep-alive';
            options["jar"] = true;
            options["agent"] = new https_1.Agent({ keepAlive: true, rejectUnauthorized: options.rejectUnauthorized });
            var type1msg = createType1Message(ntlmOptions.workstation, ntlmOptions.domain); // alternate client - ntlm-client
            var opt = Object.assign({}, options);
            opt['method'] = "GET";
            opt.headers['Authorization'] = type1msg;
            delete opt['body'];
            request(opt, function (error, response, body) {
                try {
                    if (error) {
                        reject(error);
                    }
                    else {
                        if (!response.headers['www-authenticate'])
                            throw new Error('www-authenticate not found on response of second request');
                        var type2msg = decodeType2Message(response.headers['www-authenticate']);
                        var type3msg = createType3Message(type2msg, ntlmOptions.username, ntlmOptions.password, ntlmOptions.workstation, ntlmOptions.domain);
                        delete options.headers['authorization']; // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails
                        delete options.headers['connection']; // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails
                        options.headers['Authorization'] = type3msg;
                        options.headers['Connection'] = 'Close';
                        resolve(options);
                    }
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    };
    return NtlmProvider;
}());
exports.NtlmProvider = NtlmProvider;
