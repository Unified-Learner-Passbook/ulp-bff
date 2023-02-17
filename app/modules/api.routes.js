const express = require('express');
const router = express.Router();
const resp = require("../helpers/response.helper");
const middleware = require('../middleware/middleware.api')

module.exports = router;


router.post('/data-import', async (req, res) => {

    console.log("POST /data-import", req.body)
    if (req.body) {

        var payload = req.body

        let payloadObj = {
            "content": [
                {
                    "alsoKnownAs": [
                        `did.${payload.schoolId}`
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
        }

        const issuerRes = await middleware.generateDid(payloadObj);

        console.log("issuerRes", issuerRes)

        console.log("issuerRes", issuerRes[0].verificationMethod[0].controller)
        var issuerId = issuerRes[0].verificationMethod[0].controller

        var responseArray = []

        for (const iterator of payload.studentData) {

            let payloadObj2 = {
                "content": [
                    {
                        "alsoKnownAs": [
                            `did.${iterator.student_id}`
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
            }

            const credRes = await middleware.generateDid(payloadObj2);

            console.log("credRes", credRes[0].verificationMethod[0].controller)
            let credId = credRes[0].verificationMethod[0].controller

            iterator.issuerId = issuerId
            iterator.grade = payload.grade
            iterator.credId = credId
            console.log("iterator", iterator)


            const cred = await middleware.issueCredentials(iterator)
            console.log("cred 34", cred)

            if (cred) {
                responseArray.push(cred)
            }

        }
        if (responseArray.length > 0) {
            resp.successGetResponse(res, responseArray, 'api response');
        }


    }

})

router.post('/data-import2', async (req, res) => {

    console.log("POST /data-import", req.body)
    if (req.body) {

        var payload = req.body

        let payloadObj = {
            "content": [
                {
                    "alsoKnownAs": [
                        `did.${payload.schoolId}`
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
        }

        const issuerRes = await middleware.generateDid(payloadObj);

        console.log("issuerRes", issuerRes)

        console.log("issuerRes", issuerRes[0].verificationMethod[0].controller)
        var issuerId = issuerRes[0].verificationMethod[0].controller


        const promises = [];

        for (const iterator of payload.studentData) {

            let payloadObj2 = {
                "content": [
                    {
                        "alsoKnownAs": [
                            `did.${iterator.student_id}`
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
            }
            promises.push(middleware.generateDid(payloadObj2));

        }

        console.log("promises 170", promises)
        
        let credRes = []
        await Promise.all(promises)
            .then((values) => {
                console.log("values 175", values);
                credRes = values;
                //resp.successGetResponse(res, values, 'api response');
            })
            .catch((error) => {
                console.error("err 187", error.message);
            });

        console.log("credRes 182", credRes[0][0].verificationMethod[0].controller)
        
        const promises2 = [];
        
        for (const iterator of credRes) {
            
            let credId = iterator[0].verificationMethod[0].controller

            iterator.issuerId = issuerId
            iterator.grade = payload.grade
            iterator.credId = credId
            console.log("iterator", iterator)

            promises2.push(middleware.issueCredentials(iterator))
            
        }

        console.log("promises2 200", promises2)
        return;
        await Promise.all(promises2)
            .then((values) => {
                console.log("values 202", values);
                resp.successGetResponse(res, values, 'api response');
            })
            .catch((error) => {
                console.error("err 206", error.message);
                resp.errorResponse(res, error.message, '500', "internl server error")
            });

    }

})