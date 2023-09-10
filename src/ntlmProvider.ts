import axios, { AxiosRequestConfig, AxiosInstance } from "axios";
import { createType1Message, decodeType2Message, createType3Message } from "@ewsjs/ntlm-client";
import { Agent as httpsAgent } from "https";

import { IProvider, PreCallConfig } from "./IProvider";

export class NtlmProvider implements IProvider {

  private _client: AxiosInstance = null;

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

  get client(): AxiosInstance {
    return this._client;
  }

  async preCall(options: PreCallConfig) {
    let ntlmOptions = {
      url: options.url,
      username: this.username,
      password: this.password,
      workstation: options['workstation'] || '.',
      domain: this.domain,
    };

    options.headers['Connection'] = 'keep-alive';

    options.httpsAgent = new httpsAgent({ keepAlive: true, rejectUnauthorized: options.rejectUnauthorized })
    let type1msg = createType1Message(ntlmOptions.workstation, ntlmOptions.domain); // alternate client - ntlm-client
    let opt: AxiosRequestConfig = (<any>Object).assign({}, options);
    opt['method'] = "GET";
    opt.headers['Authorization'] = type1msg;
    delete opt['data'];
    delete opt['responseType'];

    try {
      const response = await axios(opt).catch(err => err.response);

      if (!response.headers['www-authenticate'])
        throw new Error('www-authenticate not found on response of second request');

      let type2msg = decodeType2Message(response.headers['www-authenticate']);
      let type3msg = createType3Message(type2msg, ntlmOptions.username, ntlmOptions.password, ntlmOptions.workstation, ntlmOptions.domain);

      delete options.headers['authorization'] // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails
      delete options.headers['connection'] // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails

      options.headers['Authorization'] = type3msg;
      options.headers['Connection'] = 'Close';
      return options;
    } catch (err) {
      throw err;
    }
  }
}
