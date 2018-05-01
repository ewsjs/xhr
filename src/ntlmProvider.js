"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var Promise = require("bluebird");
var https_1 = require("https");
var _a = require("ntlm-client"), createType1Message = _a.createType1Message, decodeType2Message = _a.decodeType2Message, createType3Message = _a.createType3Message; //ref: has NTLM v2 support // info: also possible to use this package in node.
//var ntlm = require('httpntlm').ntlm; //removing httpntlm due to lack of NTLM v2
// var HttpsAgent = require('agentkeepalive').HttpsAgent; // can use this instead of node internal http agent
// var keepaliveAgent = new HttpsAgent(); // new HttpsAgent({ keepAliveMsecs :10000}); need to add more seconds to keepalive for debugging time. debugging is advised on basic auth only
var NtlmProvider = /** @class */ (function () {
    function NtlmProvider(username, password /*, allowUntrustedCertificate: boolean = false*/) {
        this.username = null;
        this.password = null;
        this.domain = '';
        this.username = username || '';
        this.password = password || '';
        // this.allowUntrustedCertificate = allowUntrustedCertificate;
        if (username.indexOf("\\") > 0) {
            this.username = username.split("\\")[1];
            this.domain = username.split("\\")[0].toUpperCase();
        }
    }
    Object.defineProperty(NtlmProvider.prototype, "providerName", {
        // private allowUntrustedCertificate: boolean;
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
            //let type1msg = ntlm.createType1Message(ntlmOptions); //lack of v2
            // if (this.allowUntrustedCertificate) {
            //     options["rejectUnauthorized"] = !this.allowUntrustedCertificate;
            // options["rejectUnauthorized"] = false;
            // }
            // options.headers['User-Agent'] = 'foo';
            options.headers['Connection'] = 'keep-alive';
            options["jar"] = true;
            options["agent"] = new https_1.Agent({ keepAlive: true, rejectUnauthorized: options.rejectUnauthorized });
            // debugger;
            var type1msg = createType1Message(ntlmOptions.workstation, ntlmOptions.domain); // alternate client - ntlm-client
            var opt = Object.assign({}, options);
            opt['method'] = "GET";
            opt.headers['Authorization'] = type1msg;
            delete opt['body'];
            //opt.tunnel = true;
            // console.log("in provider");
            // console.log(opt);
            // console.log(opt.headers);
            // console.log(opt.headers.Connection);
            request(opt, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else {
                    // let xhrResponse: XMLHttpRequest = <any>{
                    //     response: body ? body.toString() : '',
                    //     status: response.statusCode,
                    //     //redirectCount: meta.redirectCount,
                    //     headers: response.headers,
                    //     finalUrl: response.url,
                    //     responseType: '',
                    //     statusText: response.statusMessage,
                    // };
                    if (!response.headers['www-authenticate'])
                        throw new Error('www-authenticate not found on response of second request');
                    //let type2msg = ntlm.parseType2Message(res.headers['www-authenticate']); //httpntlm
                    //let type3msg = ntlm.createType3Message(type2msg, ntlmOptions); //httpntlm
                    var type2msg = decodeType2Message(response.headers['www-authenticate']); //with ntlm-client
                    var type3msg = createType3Message(type2msg, ntlmOptions.username, ntlmOptions.password, ntlmOptions.workstation, ntlmOptions.domain); //with ntlm-client
                    delete options.headers['authorization']; // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails
                    delete options.headers['connection']; // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails
                    options.headers['Authorization'] = type3msg;
                    options.headers['Connection'] = 'Close';
                    resolve(options);
                }
            });
        });
    };
    return NtlmProvider;
}());
exports.NtlmProvider = NtlmProvider;
