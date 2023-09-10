"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NtlmProvider = void 0;
const axios_1 = require("axios");
const ntlm_client_1 = require("@ewsjs/ntlm-client");
const https_1 = require("https");
class NtlmProvider {
    get providerName() {
        return "ntlm";
    }
    constructor(username, password) {
        this._client = null;
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
    get client() {
        return this._client;
    }
    async preCall(options) {
        let ntlmOptions = {
            url: options.url,
            username: this.username,
            password: this.password,
            workstation: options['workstation'] || '.',
            domain: this.domain,
        };
        options.headers['Connection'] = 'keep-alive';
        options.httpsAgent = new https_1.Agent({ keepAlive: true, rejectUnauthorized: options.rejectUnauthorized });
        let type1msg = (0, ntlm_client_1.createType1Message)(ntlmOptions.workstation, ntlmOptions.domain); // alternate client - ntlm-client
        let opt = Object.assign({}, options);
        opt['method'] = "GET";
        opt.headers['Authorization'] = type1msg;
        delete opt['data'];
        delete opt['responseType'];
        try {
            const response = await (0, axios_1.default)(opt).catch(err => err.response);
            if (!response.headers['www-authenticate'])
                throw new Error('www-authenticate not found on response of second request');
            let type2msg = (0, ntlm_client_1.decodeType2Message)(response.headers['www-authenticate']);
            let type3msg = (0, ntlm_client_1.createType3Message)(type2msg, ntlmOptions.username, ntlmOptions.password, ntlmOptions.workstation, ntlmOptions.domain);
            delete options.headers['authorization']; // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails
            delete options.headers['connection']; // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails
            options.headers['Authorization'] = type3msg;
            options.headers['Connection'] = 'Close';
            return options;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.NtlmProvider = NtlmProvider;
