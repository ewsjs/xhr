import * as request from 'request';
import * as  Promise from "bluebird";
import { IXHROptions } from "./ews.partial";

import { IProvider } from "./IProvider";

import { Agent as httpsAgent } from "https";


export class CookieProvider implements IProvider {
    /**@internal */
    private j = null;
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

    preCall(options: IXHROptions) {
        return new Promise<IXHROptions>((resolve, reject) => {
            if (options.headers["Authorization"]) {
                delete options.headers["Authorization"];
            }
            // if (!this.cookies || this.cookies.length < 1) {
            if (!this.j) {
                if (!this.j) this.j = request.jar();
                options.jar = this.j;
                var parser = CookieProvider.parseString(options.url);
                var baseUrl = parser.scheme + "://" + parser.authority + "/CookieAuth.dll?Logon";
                var preauthOptions = Object.assign({}, options, {
                    method: <any>"POST",
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'curl=Z2F&flags=0&forcedownlevel=0&formdir=1&trusted=0&username=' + this.username + '&password=' + this.password,
                    url: baseUrl,
                    disableRedirects: true,
                });
                //obtaining cookies
                request(preauthOptions, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(options);
                    }
                });
            }
            else {
                options.jar = this.j;
                resolve(options);
            }
        });
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
