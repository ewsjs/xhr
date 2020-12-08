import { IXHRApi, IXHROptions, IXHRProgress } from "./ews.partial";
import * as Promise from "bluebird";

export declare class ntlmAuthXhrApi implements IXHRApi {

    get apiName(): string;

    constructor(username: string, password: string, allowUntrustedCertificate?: boolean);

    xhr(xhroptions: IXHROptions, progressDelegate?: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;

    xhrStream(xhroptions: IXHROptions, progressDelegate: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;

    disconnect(): void;
}