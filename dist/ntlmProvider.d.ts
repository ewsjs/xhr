import { AxiosInstance } from 'axios';
import { IProvider, PreCallConfig } from './IProvider';
export declare class NtlmProvider implements IProvider {
    private _client;
    private username;
    private password;
    private domain;
    get providerName(): string;
    constructor(username: string, password: string);
    get client(): AxiosInstance;
    preCall(options: PreCallConfig): Promise<PreCallConfig>;
}
