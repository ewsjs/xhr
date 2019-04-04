import * as request from 'request';
import * as  Promise from "bluebird";
import { IXHROptions } from "./ews.partial";

import { IProvider } from "./IProvider";

import { Agent as httpsAgent } from "https";

var { createType1Message, decodeType2Message, createType3Message } = require("ntlm-client") //ref: has NTLM v2 support // info: also possible to use this package in node.

export class NtlmProvider implements IProvider {

    private username: string = null;
    private password: string = null;
    private domain: string = '';

    get providerName(): string {
        return "ntlm";
    }

    constructor(username: string, password: string) {

        this.username = username || '';
        this.password = password || '';

        if (username.indexOf("\\") > 0) {
            this.username = username.split("\\")[1];
            this.domain = username.split("\\")[0].toUpperCase();
        }
    }

    preCall(options: IXHROptions) {
        let ntlmOptions = {
            url: options.url,
            username: this.username,
            password: this.password,
            workstation: options['workstation'] || '.',
            domain: this.domain,
        };

        return new Promise<IXHROptions>((resolve, reject) => {

            options.headers['Connection'] = 'keep-alive';

            options["jar"] = true;

            options["agent"] = new httpsAgent({ keepAlive: true, rejectUnauthorized: options.rejectUnauthorized })
            let type1msg = createType1Message(ntlmOptions.workstation, ntlmOptions.domain); // alternate client - ntlm-client
            let opt = (<any>Object).assign({}, options);
            opt['method'] = "GET";
            opt.headers['Authorization'] = type1msg;
            delete opt['body'];

            request(opt, (error, response, body) => {
                try {
                    if (error) {
                        reject(error);
                    }
                    else {
                        
                        if (!response.headers['www-authenticate'])
                            throw new Error('www-authenticate not found on response of second request');

                        let type2msg = decodeType2Message(response.headers['www-authenticate']);
                        let type3msg = createType3Message(type2msg, ntlmOptions.username, ntlmOptions.password, ntlmOptions.workstation, ntlmOptions.domain);

                        delete options.headers['authorization'] // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails
                        delete options.headers['connection'] // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails

                        options.headers['Authorization'] = type3msg;
                        options.headers['Connection'] = 'Close';
                        resolve(options);
                    }
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
}
