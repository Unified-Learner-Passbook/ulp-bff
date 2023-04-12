import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class CredService {

    constructor(private readonly httpService: HttpService) { }

    //generate schema
    async generateSchema(schemaId) {

        const url = `${process.env.SCHEMA_URL}/schema/jsonld?id=${schemaId}`;

        try {
            const observable = this.httpService.get(url);

            const promise = observable.toPromise();

            const response = await promise;

            return response.data;
        } catch (e) {
            console.log("schema error", e.message)
        }

    }

    //generate did
    async generateDid(studentId) {
        const data = JSON.stringify({
            "content": [
                {
                    "alsoKnownAs": [
                        `did.${studentId}`
                    ],
                    "services": [
                        {
                            "id": "IdentityHub",
                            "type": "IdentityHub",
                            "serviceEndpoint": {
                                "@context": "schema.identity.foundation/hub",
                                "@type": "UserServiceEndpoint",
                                "instance": [
                                    "did:test:hub.id"
                                ]
                            }
                        }
                    ]
                }
            ]
        });

        const url = `${process.env.DID_URL}/did/generate`;

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
            console.log("did error", e.message)
        }
    }

    //issue credentials
    async issueCredentials(payload) {

        var data = JSON.stringify({
            "credential": {
                "@context": [
                    "https://www.w3.org/2018/credentials/v1",
                    "https://www.w3.org/2018/credentials/examples/v1"
                ],
                "id": "did:ulp:b4a191af-d86e-453c-9d0e-dd4771067235",
                "type": [
                    "VerifiableCredential",
                    "UniversityDegreeCredential"
                ],
                "issuer": `${payload.issuerId}`,
                "issuanceDate": payload.issuanceDate,
                "expirationDate": payload.expirationDate,
                "credentialSubject": payload.credentialSubject,
                "options": {
                    "created": "2020-04-02T18:48:36Z",
                    "credentialStatus": {
                        "type": "RevocationList2020Status"
                    }
                }
            },
            "credentialSchemaId": payload.credSchema.id,
            "tags": [
                "tag1",
                "tag2",
                "tag3"
            ]
        });

        const url = `${process.env.CRED_URL}/credentials/issue`;

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
            console.log("cred error", e.message)
        }

    }

}
