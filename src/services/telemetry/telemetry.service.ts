import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class TelemetryService {

    constructor(private readonly httpService: HttpService) {}

    async telemetry(telemetryData) {
        console.log("telemetryData", telemetryData)
        let data = JSON.stringify({
            "id": "api.sunbird.telemetry",
            "ver": "3.0",
            "params": {
              "msgid": "1fa187a4a1a95aec09afb64509e80244"
            },
            "ets": 1681478511085,
            "events": [
              {
                "eid": "INTERACT",
                "ets": 1681478511050,
                "ver": "3.0",
                "mid": "INTERACT:c2be1d512afe0084370979ec1c8e01e8",
                "actor": {
                  "id": "a39a56d0153a5d327a68059432760ca9",
                  "type": "User"
                },
                "context": {
                  "channel": "default",
                  "pdata": {
                    "id": "ulp.bff",
                    "pid": "0.0.1",
                    "ver": "rulp.bff"
                  },
                  "env": "digilocker",
                  "sid": "f5179f99-c037-4217-acc9-b615184eb83a",
                  "did": "a39a56d0153a5d327a68059432760ca9",
                  "cdata": [
                    {
                      "id": "f5179f99-c037-4217-acc9-b615184eb83a",
                      "type": "UserSession"
                    },
                    {
                      "id": "Desktop",
                      "type": "Device"
                    }
                  ],
                  "rollup": {},
                  "uid": "anonymous"
                },
                "object": {},
                "tags": [],
                "edata": {
                  "id": telemetryData.result,
                  "type": "CLICK",
                  "pageid": "digilocker-callback"
                }
              }
            ]
          });
    
        //const url = process.env.TELEMETRY_URL + '/v1/telemetry';
        const url = process.env.TELEMETRY_URL + '/v1/telemetry'
    
        const config: AxiosRequestConfig = {
          headers: {
            'Content-Type': 'application/json',
          },
        };
    
        try {
          const observable = this.httpService.post(url, data, config);
    
          const promise = observable.toPromise();
    
          const response = await promise;
            console.log("Tel response", response.data)
          return response.data;
        } catch (e) {
          console.log('Telemetry API error', e.message);
        }
      }
}
