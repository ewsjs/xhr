import { IXHROptions } from "./ews.partial";
import * as  Promise from "bluebird";

export interface IProvider {
    preCall(options: IXHROptions): Promise<IXHROptions>;
    providerName: string;

}