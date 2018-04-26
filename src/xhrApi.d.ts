/// <reference types="bluebird" />
import * as Promise from "bluebird";
import { IXHROptions, IXHRApi, IXHRProgress } from "./ews.partial";
import { IProvider } from "./IProvider";
export declare class XhrApi implements IXHRApi {
    /**@internal */ private allowUntrustedCertificate;
    private proxyConfig;
    readonly apiName: string;
    constructor(/**@internal */ allowUntrustedCertificate?: boolean);
    useProxy(url: string, proxyUserName?: string, proxyPassword?: string): XhrApi;
    setAuthProvider(authProvider: IProvider): void;
    xhr(xhroptions: IXHROptions, progressDelegate?: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    xhrStream(xhroptions: IXHROptions, progressDelegate: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    disconnect(): void;
    getProxyString(): string;
}
