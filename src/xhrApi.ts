import * as request from 'request';
import * as  Promise from "bluebird";
import { IXHROptions, IXHRApi, IXHRProgress } from "./ews.partial";
import { setupXhrResponse } from "./utils";

import { Agent as httpsAgent } from "https";
import { ClientResponse } from "http"
import { IProvider } from "./IProvider";
import { NtlmProvider } from './ntlmProvider';
import { CookieProvider } from './cookieProvider';


export class XhrApi implements IXHRApi {

    /**
     * @internal 
     */
    private stream: any;
    private proxyConfig = {
        enabled: false,
        url: null,
        userName: null,
        password: null,
    };

    get apiName(): string {
        return "proxy";
    }

    constructor(/**@internal */ private allowUntrustedCertificate: boolean = false) {

    }

    /**
     * Enable use of Proxy server when using this XHR Api
     * 
     * @param {string} url Proxy server url with port, usally http://server:8080 or https://server:port
     * @param {string} [proxyUserName=null] proxy server authentication username
     * @param {string} [proxyPassword=null] proxy server authentication password
     * @returns {XhrApi} this returns the instance for chaining
     * @memberof XhrApi
     */
    useProxy(url: string, proxyUserName: string = null, proxyPassword: string = null): XhrApi {
        this.proxyConfig = { enabled: url !== null, url: url, userName: proxyUserName, password: proxyPassword };
        return this;
    }

    useNtlmAuthentication(username: string, password: string): XhrApi {
        if (this.proxyConfig.enabled === true) {
            throw new Error("NtlmProvider does not work with proxy (yet!)")
        }
        this.authProvider = new NtlmProvider(username, password);
        return this;
    }

    useCookieAuthentication(username: string, password: string): XhrApi {
        this.authProvider = new CookieProvider(username, password);
        return this;
    }

    setAuthProvider(authProvider: IProvider): void {
        this.authProvider = authProvider;
    }

    /**@internal */
    private authProvider: IProvider = null;


    xhr(xhroptions: IXHROptions, progressDelegate?: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest> {

        //setup xhr for github.com/andris9/fetch options
        let options: IXHROptions = <any>{
            url: xhroptions.url,
            body: xhroptions.data,
            headers: xhroptions.headers,
            method: <any>xhroptions.type,
            followRedirect: false,
            //resolveWithFullResponse: true
        }
        options["rejectUnauthorized"] = !this.allowUntrustedCertificate;

        // if (this.allowUntrustedCertificate) {
        //     options["rejectUnauthorized"] = !this.allowUntrustedCertificate;
        // }

        let proxyStr = this.getProxyString();
        if (proxyStr) {
            options["proxy"] = proxyStr;
        }

        return new Promise<XMLHttpRequest>((resolve, reject) => {


            let _promise: Promise<IXHROptions> = Promise.resolve(options);

            if (this.authProvider) {
                _promise = this.authProvider.preCall(options);
            }
            _promise.then(opt => {
                // console.log("in proxy");
                // console.log(opt);
                request(opt || options, (error, response, body) => {
                    if (error) {
                        rejectWithError(reject, error);
                    }
                    else {
                        let xhrResponse: XMLHttpRequest = <any>{
                            response: body ? body.toString() : '',
                            status: response.statusCode,
                            //redirectCount: meta.redirectCount,
                            headers: response.headers,
                            finalUrl: response.url,
                            responseType: '',
                            statusText: response.statusMessage,
                        };
                        if (xhrResponse.status === 200) {
                            resolve(setupXhrResponse(xhrResponse));
                        }
                        else {
                            reject(setupXhrResponse(xhrResponse));
                        }
                    }
                });
            }, reason => {
                reject(setupXhrResponse(reason));
            });
        });

    }

    xhrStream(xhroptions: IXHROptions, progressDelegate: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest> {

        //setup xhr for github.com/andris9/fetch options
        let options = {
            url: xhroptions.url,
            body: xhroptions.data,
            headers: xhroptions.headers,
            method: <any>xhroptions.type,
            followRedirect: false,

        }

        options["rejectUnauthorized"] = !this.allowUntrustedCertificate;

        // if (this.allowUntrustedCertificate) {
        //     options["rejectUnauthorized"] = !this.allowUntrustedCertificate;
        // }

        return new Promise<XMLHttpRequest>((resolve, reject) => {

            let _promise: Promise<IXHROptions> = Promise.resolve(options);

            if (this.authProvider) {
                _promise = this.authProvider.preCall(options);
            }

            _promise.then(opt => {
                this.stream = request(options);

                this.stream.on('response', function (response) {
                    // unmodified http.IncomingMessage object
                    progressDelegate({ type: "header", headers: response["headers"] })
                })
                this.stream.on("data", (chunk) => {
                    // decompressed data as it is received
                    // console.log('decoded chunk: ' + chunk)
                    // console.log(chunk.toString());
                    progressDelegate({ type: "data", data: chunk.toString() });
                });

                this.stream.on("end", () => {
                    progressDelegate({ type: "end" });
                    resolve();
                });

                this.stream.on('error', (error) => {
                    progressDelegate({ type: "error", error: error });
                    this.disconnect();
                    rejectWithError(reject, error);
                });
            }, reason => {
                reject(setupXhrResponse(reason));
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

    getProxyString(): string {
        if (this.proxyConfig.enabled) {
            let url: string = this.proxyConfig.url;
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
}


function rejectWithError(reject: Function, reason) {
    let xhrResponse: XMLHttpRequest = <any>{
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
            let parse: any[] = reason.message.match(/statusCode=(\d*?)$/)
            if (parse && parse.length > 1) {
                xhrResponse[<any>"status"] = Number(parse[1]);
            }
        } catch (e) { }
    }
    reject(setupXhrResponse(xhrResponse));
}
