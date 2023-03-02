export declare class TestAPIService {
    getAPI(): any;
    getAPIID(getId: string): {
        statusCode: number;
        message: string;
        error: string;
    };
    postAPIID(postId: string): {
        statusCode: number;
        message: string;
        error: string;
    };
}
