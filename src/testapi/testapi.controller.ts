import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { TestAPIService } from './testapi.services';

@Controller('testapi')
export class TestAPIController {
  constructor(private readonly testapiService: TestAPIService) {}

  @Get('getapi')
  getAPI(): any {
    return this.testapiService.getAPI();
  }
  @Get('getapi/:id')
  getAPIID(@Param('id') getId: string) {
    return this.testapiService.getAPIID(getId);
  }
  @Post('postapi')
  postAPIID(@Body('postId') postId: string) {
    return this.testapiService.postAPIID(postId);
  }
}
