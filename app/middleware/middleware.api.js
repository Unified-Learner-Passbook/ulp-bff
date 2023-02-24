var axios = require('axios');
const cred_url = process.env.CRED_URL || 'http://64.227.185.154:3002';
const did_url = process.env.DID_URL || 'http://64.227.185.154:3000';
const schema_url = process.env.SCHEMA_URL || 'http://64.227.185.154:3001';

async function generateDid(payload) {
    var data = JSON.stringify({
        "content": [
            {
                "alsoKnownAs": [
                    `did.${payload}`
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

    var config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${did_url}/did/generate`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    try {
        const response = await axios(config)
        //console.log("response did", response.data)
        return response.data;
    } catch (error) {
        console.log("error did", error)
    }


}

async function generateSchema(payload) {

    var config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${schema_url}/schema/jsonld?id=${payload}`,
        headers: {}
    };

    try {
        const response = await axios(config)
        console.log("response schema", response.data)
        return response.data;
    } catch (error) {
        console.log("error schema", error)
    }

}

async function issueCredentials(payload) {

    //console.log("payload issueCred", payload)

    var data = JSON.stringify({
        "credential": {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://www.w3.org/2018/credentials/examples/v1"
            ],
            "id": "",
            "type": [
                "VerifiableCredential",
                "UniversityDegreeCredential"
            ],
            "issuer": `${payload.issuerId}`,
            "issuanceDate": "2023-02-06T11:56:27.259Z",
            "expirationDate": "2023-02-08T11:56:27.259Z",
            "credentialSubject": payload.credentialSubject,
            "options": {
                "created": "2020-04-02T18:48:36Z",
                "credentialStatus": {
                    "type": "RevocationList2020Status"
                }
            }
        },
        "credentialSchema": payload.credSchema
    });

    //console.log("data 99", JSON.parse(data))

    var config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${cred_url}/credentials/issue`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    try {

        const response = await axios(config)
        //console.log("response cred", response.data)
        return response.data;

    } catch (error) {
        console.log("cred error", error)
    }



}

module.exports = {
    generateDid,
    issueCredentials,
    generateSchema
}

