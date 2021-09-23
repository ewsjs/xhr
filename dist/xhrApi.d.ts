import { CoreOptions } from "request";
import * as Promise from "bluebird";
import { IXHROptions, IXHRApi, IXHRProgress } from "./ews.partial";
import { IProvider } from "./IProvider";
/**
 * this is alternate XHR Api for ews-javascript-api/ewsjs
 *
 * @export
 * @class XhrApi
 * @implements {IXHRApi}
 */
export declare class XhrApi implements IXHRApi {
    static defaultOptions: CoreOptions;
    requestOptions: CoreOptions;
    private allowUntrustedCertificate;
    private proxyConfig;
    get apiName(): string;
    /**
     * Creates an instance of XhrApi optionally passing options for request
     * @memberof XhrApi
     */
    constructor();
    /**
     * Creates an instance of XhrApi optionally passing options for request
     * @param {CoreOptions} requestOptions Options for request
     * @memberof XhrApi
     */
    constructor(requestOptions: CoreOptions);
    /**
     * Creates an instance of XhrApi. optionally pass true to bypass remote ssl/tls certificate check
     * @param {boolean} allowUntrustedCertificate whether to allow non trusted certificate or not
     * @memberof XhrApi
     */
    constructor(allowUntrustedCertificate: boolean);
    /**
     * Enable use of Proxy server when using this XHR Api
     *
     * @param {string} url Proxy server url with port, usally http://server:8080 or https://server:port
     * @param {string} [proxyUserName=null] proxy server authentication username
     * @param {string} [proxyPassword=null] proxy server authentication password
     * @returns {XhrApi} returns instance for chaining
     * @memberof XhrApi
     */
    useProxy(url: string, proxyUserName?: string, proxyPassword?: string): XhrApi;
    /**
     * use NTLM authentication method, supports Ntlm v2
     *
     * @param {string} username username for ntlm
     * @param {string} password password for ntlm
     * @returns {XhrApi} returns instance for chaining
     * @memberof XhrApi
     */
    useNtlmAuthentication(username: string, password: string): XhrApi;
    /**
     * use cookies authentication method, usually required when hosted behind ISA/TMG
     *
     * @param {string} username username for cookies auth
     * @param {string} password password for cookies auth
     * @returns {XhrApi} returns instance for chaining
     * @memberof XhrApi
     */
    useCookieAuthentication(username: string, password: string): XhrApi;
    /**
     * set custom IProvider interface, needed for custom IProvider implementing custom precall method
     *
     * @param {IProvider} authProvider auth provider implementing IProvider interface
     * @memberof XhrApi
     */
    setAuthProvider(authProvider: IProvider): void;
    xhr(xhroptions: IXHROptions, progressDelegate?: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    xhrStream(xhroptions: IXHROptions, progressDelegate: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    disconnect(): void;
    private getProxyString;
    private getOptions;
}
