import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';


@Injectable()
export class SbrcService {

    constructor(private readonly httpService: HttpService) { }

    // create
    async sbrcInvite(inviteSchema, entityName) {

        const data = JSON.stringify(inviteSchema);

        
        const url = process.env.REGISTRY_URL + 'api/v1/' + entityName + '/invite';
            
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        try {
            const observable = this.httpService.post(url, data, config);

            const promise = observable.toPromise();

            const response = await promise;

            return response.data;
        } catch (e) {
            console.log("sbrcInvite error", e.message)
        }
    }

    //search
    async sbrcSearch(searchSchema, entityName) {

        console.log("searchSchema", searchSchema)
        console.log("entityName", entityName)
        const data = JSON.stringify(searchSchema);

        const url = process.env.REGISTRY_URL + 'api/v1/' + entityName + '/search';
        
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        try {
            const observable = this.httpService.post(url, data, config);

            const promise = observable.toPromise();

            const response = await promise;

            console.log("sbrcSearch", response.data)

            return response.data;
        } catch (e) {
            console.log("sbrcSearch error", e.message)
        }

    }

    //update
    async sbrcUpdate(updateSchema, entityName, osid) {
        console.log("updateSchema", updateSchema)
        console.log("entityName", entityName)
        console.log("osid", osid)
        let data = JSON.stringify(updateSchema);

        const url = process.env.REGISTRY_URL + 'api/v1/' + entityName + '/' + osid;
            
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        try {
            const observable = this.httpService.put(url, data, config);

            const promise = observable.toPromise();

            const response = await promise;

            return response.data;
        } catch (e) {
            console.log("sbrcUpdate error", e.message)
        }
    }
}
