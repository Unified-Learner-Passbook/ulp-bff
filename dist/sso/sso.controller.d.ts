import { SSOService } from './sso.services';
export declare const keycloakConfig: {
    realm: string;
    clientId: string;
    clientSecret: string;
    baseUrl: string;
};
export declare class SSOController {
    private readonly ssoService;
    constructor(ssoService: SSOService);
    getUser(): string;
    registerStudent(username: string, name: string): Promise<{
        statusCode: number;
        message: string;
        error: string;
    }>;
}
