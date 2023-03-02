import { SSOService } from './sso.services';
export declare class SSOController {
    private readonly ssoService;
    constructor(ssoService: SSOService);
    registerStudent(username: string, name: string): Promise<{
        statusCode: number;
        message: string;
        error: string;
    }>;
}
