import * as Promise from "bluebird";
import { IXHROptions } from "./ews.partial";
import { IProvider } from "./IProvider";
export declare class CookieProvider implements IProvider {
    get providerName(): string;
    constructor(username: string, password: string);
    preCall(options: IXHROptions): Promise<IXHROptions>;
}
