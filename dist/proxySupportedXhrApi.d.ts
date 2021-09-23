import * as Promise from "bluebird";
import { IXHROptions, IXHRApi, IXHRProgress } from "./ews.partial";
import { IProvider } from "./IProvider";
export declare class proxySupportedXhrApi implements IXHRApi {
    proxyUrl: string;
    proxyUser: string;
    proxyPassword: string;
    allowUntrustedCertificate: boolean;
    private stream;
    get apiName(): string;
    constructor(proxyUrl: string);
    constructor(proxyUrl: string, allowUntrustedCertificate: boolean);
    constructor(proxyUrl: string, proxyUserName: string, proxyPassword: string);
    constructor(proxyUrl: string, proxyUserName: string, proxyPassword: string, allowUntrustedCertificate: boolean);
    SetProvider(provider: IProvider): void;
    private provider;
    xhr(xhroptions: IXHROptions, progressDelegate?: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    xhrStream(xhroptions: IXHROptions, progressDelegate: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    disconnect(): void;
    getProxyString(): string;
}
