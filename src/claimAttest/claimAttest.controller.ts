import { Controller, Get,Post,Res ,Headers} from '@nestjs/common';
import {ClaimAttestService} from './claimAttest.service';
import { Response } from 'express';

@Controller('v1/claim')
export class ClaimAttestController{
    constructor(private readonly claimAttestService: ClaimAttestService){}

    @Get('/test')
    test(){
        return this.claimAttestService.test();
    }
    @Post('/sent')
    sent(
        @Headers('Authorization') token:string){
        return this.claimAttestService.sent(token);
    }
    @Post('/search')
    search(){
        return this.claimAttestService.search();
    }
    @Post('/attest')
    attest(){
        return this.claimAttestService.attest();
    }
}