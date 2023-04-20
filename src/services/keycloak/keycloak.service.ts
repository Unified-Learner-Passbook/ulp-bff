import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class KeycloakService {
    constructor(private readonly httpService: HttpService) { }

    async verifyUserToken(token: string) {

        const url = process.env.KEYCLOAK_URL + 'realms/' + process.env.REALM_ID + '/protocol/openid-connect/userinfo';
            
        const config: AxiosRequestConfig = {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: 'Bearer ' + token,
            },
        };
        
        let response_text = null;
        try {
            const observable = this.httpService.get(url, config);

            const promise = observable.toPromise();

            const response = await promise;

            response_text = response.data;
        } catch (error) {
            console.log("verifyUserToken error", error.message)
            response_text = { error: error };
        }

        return response_text;
    }
    
}
