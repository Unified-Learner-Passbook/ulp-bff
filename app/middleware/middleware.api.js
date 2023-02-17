var axios = require('axios');
const cred_url = process.env.CRED_URL || 'http://64.227.185.154:3002'
const did_url = process.env.DID_URL || 'http://64.227.185.154:3000';

async function generateDid(payload) {
    var data = JSON.stringify(payload);

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
        console.log("response did", response.data)
        return response.data;
    } catch (error) {
        console.log("error did", error)
    }
    
        
}

async function issueCredentials(payload) {

    console.log("payload issueCred", payload)
    
    var data = JSON.stringify({
        "credential": {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://www.w3.org/2018/credentials/examples/v1"
            ],
            "id": "did:ulp:0794a366-2478-4040-9204-6188c3671f5c",
            "type": [
                "VerifiableCredential",
                "UniversityDegreeCredential"
            ],
            "issuer": `${payload.issuerId}`,
            "issuanceDate": "2023-02-06T11:56:27.259Z",
            "expirationDate": "2023-02-08T11:56:27.259Z",
            "credentialSubject": {
                "id": `${payload.credId}`,
                "grade": `${payload.grade}`,
                "programme": "B.Tech",
                "certifyingInstitute": "IIIT Sonepat",
                "evaluatingInstitute": "NIT Kurukshetra"
            },
            "options": {
                "created": "2020-04-02T18:48:36Z",
                "credentialStatus": {
                    "type": "RevocationList2020Status"
                }
            }
        },
        "credentialSchema": {
            "id": "did:ulpschema:c9cc0f03-4f94-4f44-9bcd-b24a86596fa2",
            "type": "https://w3c-ccg.github.io/vc-json-schemas/",
            "version": "1.0",
            "name": "Proof of Academic Evaluation Credential",
            "author": "did:example:c276e12ec21ebfeb1f712ebc6f1",
            "authored": "2022-12-19T09:22:23.064Z",
            "schema": {
                "$id": "Proof-of-Academic-Evaluation-Credential-1.0",
                "type": "object",
                "$schema": "https://json-schema.org/draft/2019-09/schema",
                "required": [
                    "grade",
                    "programme",
                    "certifyingInstitute",
                    "evaluatingInstitute"
                ],
                "properties": {
                    "grade": {
                        "type": "string",
                        "description": "Grade (%age, GPA, etc.) secured by the holder."
                    },
                    "programme": {
                        "type": "string",
                        "description": "Name of the programme pursed by the holder."
                    },
                    "certifyingInstitute": {
                        "type": "string",
                        "description": "Name of the instute which certified the said grade in the said skill"
                    },
                    "evaluatingInstitute": {
                        "type": "string",
                        "description": "Name of the institute which ran the programme and evaluated the holder."
                    }
                },
                "description": "The holder has secured the <PERCENTAGE/GRADE> in <PROGRAMME> from <ABC_Institute>.",
                "additionalProperties": false
            }
        }
    });

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
        console.log("response cred", response.data)
        return response.data;
        
    } catch (error) {
        console.log("cred error", error)
        throw error
    }
    
        

}

module.exports = {
    generateDid,
    issueCredentials
}

