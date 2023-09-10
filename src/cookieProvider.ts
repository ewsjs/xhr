import axios, { AxiosRequestConfig, AxiosInstance } from "axios";
import { HttpCookieAgent, HttpsCookieAgent, createCookieAgent } from 'http-cookie-agent/http';
import { CookieJar } from 'tough-cookie';

import { IProvider, PreCallConfig } from "./IProvider";

export class CookieProvider implements IProvider {
  private _client: AxiosInstance = null;
  /**@internal */
  private jar = null;
  /**@internal */
  private username: string = null;
  /**@internal */
  private password: string = null;
  // private cookies: string[] = [];

  get providerName(): string {
    return "cookie";
  }

  constructor(username: string, password: string) {
    this.username = username || '';
    this.password = password || '';
  }

  get client(): AxiosInstance {
    return this._client;
  }

  async preCall(options: PreCallConfig) {
    if (options.headers["Authorization"]) {
      delete options.headers["Authorization"];
    }

    if (!this.jar) {
      this.jar = new CookieJar();
      this._client = axios.create({
        httpAgent: new HttpCookieAgent({ cookies: { jar: this.jar } }),
        httpsAgent: new HttpsCookieAgent({ cookies: { jar: this.jar }, rejectUnauthorized: options.rejectUnauthorized }),
      });

      var parser = CookieProvider.parseString(options.url);
      var baseUrl = parser.scheme + "://" + parser.authority + "/CookieAuth.dll?Logon";
      var preauthOptions = Object.assign({}, options, <AxiosRequestConfig>{
        method: "POST",
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: 'curl=Z2F&flags=0&forcedownlevel=0&formdir=1&trusted=0&username=' + this.username + '&password=' + this.password,
        url: baseUrl,
        maxRedirects: 0,
      });

      try {
        await this.client(preauthOptions);
        return options;
      } catch (error) {
        throw error;
      }
    } else {
      if (!this._client) this._client = axios.create({
        httpAgent: new HttpCookieAgent({ cookies: { jar: this.jar } }),
        httpsAgent: new HttpsCookieAgent({ cookies: { jar: this.jar }, rejectUnauthorized: options.rejectUnauthorized }),
      });
      return options;
    }
  }

  /**@internal */
  private static parseString(url: string) {
    var regex = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
    var parts = url.match(regex);
    return {
      scheme: parts[2],
      authority: parts[4],
      path: parts[5],
      query: parts[7],
      fragment: parts[9]
    };
  }
}
