import { Injectable } from '@nestjs/common';

@Injectable()
export class SSOService {
  getHello() {
    return 'hello ';
  }

  registerStudent(username: string, name: string) {
    if (username && name) {
      return {
        statusCode: 200,
        message: 'username ' + username + ' name ' + name,
        error: '',
      };
    } else {
      return {
        statusCode: 404,
        message: 'not received data in body',
        error: '',
      };
    }
  }
}
