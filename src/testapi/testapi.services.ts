import { Injectable } from '@nestjs/common';

@Injectable()
export class TestAPIService {
  getAPI(): any {
    return {
      statusCode: 200,
      message: 'new jenkins Test API is working',
      error: '',
    };
  }
  getAPIID(getId: string) {
    return { statusCode: 200, message: 'Get ID is ' + getId, error: '' };
  }
  postAPIID(postId: string) {
    if (postId) {
      return { statusCode: 200, message: 'Post ID is ' + postId, error: '' };
    } else {
      return {
        statusCode: 200,
        message: 'Post ID is not getting Posted' + postId,
        error: '',
      };
    }
  }
}
