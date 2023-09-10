import { AxiosRequestConfig, AxiosInstance } from "axios";
export interface IProvider {
    preCall(options: PreCallConfig): Promise<AxiosRequestConfig>;
    providerName: string;
    client: AxiosInstance;
}
export type PreCallConfig = AxiosRequestConfig & {
    rejectUnauthorized?: boolean;
};
