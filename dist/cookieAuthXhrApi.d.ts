import * as Promise from "bluebird";
import { IXHROptions, IXHRApi, IXHRProgress } from "./ews.partial";
export declare class cookieAuthXhrApi implements IXHRApi {
    private allowUntrustedCertificate;
    private stream;
    private username;
    private password;
    private cookies;
    get apiName(): string;
    constructor(username: string, password: string, allowUntrustedCertificate?: boolean);
    xhr(xhroptions: IXHROptions, progressDelegate?: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    xhrStream(xhroptions: IXHROptions, progressDelegate: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    disconnect(): void;
    private cookiesPreCall;
    private static parseString;
}
