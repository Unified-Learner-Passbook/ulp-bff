export declare class SSOService {
    getHello(): string;
    registerStudent(username: string, name: string): {
        statusCode: number;
        message: string;
        error: string;
    };
}
