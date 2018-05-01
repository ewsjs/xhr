/// <reference types="bluebird" />
import * as Promise from "bluebird";
import { IXHROptions, IXHRApi, IXHRProgress } from "./ews.partial";
import { IProvider } from "./IProvider";
export declare class XhrApi implements IXHRApi {
    /**@internal */ private allowUntrustedCertificate;
    private proxyConfig;
    readonly apiName: string;
    constructor(/**@internal */ allowUntrustedCertificate?: boolean);
    /**
     * Enable use of Proxy server when using this XHR Api
     *
     * @param {string} url Proxy server url with port, usally http://server:8080 or https://server:port
     * @param {string} [proxyUserName=null] proxy server authentication username
     * @param {string} [proxyPassword=null] proxy server authentication password
     * @returns {XhrApi} this returns the instance for chaining
     * @memberof XhrApi
     */
    useProxy(url: string, proxyUserName?: string, proxyPassword?: string): XhrApi;
    useNtlmAuthentication(username: string, password: string): XhrApi;
    useCookieAuthentication(username: string, password: string): XhrApi;
    setAuthProvider(authProvider: IProvider): void;
    xhr(xhroptions: IXHROptions, progressDelegate?: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    xhrStream(xhroptions: IXHROptions, progressDelegate: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    disconnect(): void;
    getProxyString(): string;
}
