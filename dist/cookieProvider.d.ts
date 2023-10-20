import { AxiosInstance } from 'axios';
import { IProvider, PreCallConfig } from './IProvider';
export declare class CookieProvider implements IProvider {
    private _client;
    get providerName(): string;
    constructor(username: string, password: string);
    get client(): AxiosInstance;
    preCall(options: PreCallConfig): Promise<PreCallConfig>;
}
