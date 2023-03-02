import { TestAPIService } from './testapi.services';
export declare class TestAPIController {
    private readonly testapiService;
    constructor(testapiService: TestAPIService);
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
