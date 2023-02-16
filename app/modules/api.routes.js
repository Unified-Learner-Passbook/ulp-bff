const express = require('express');
const router = express.Router();
const resp = require("../helpers/response.helper");
const middleware = require('../middleware/middleware.api')

module.exports = router;


router.post('/data-import', async (req, res) => {

    console.log("POST /data-import", req.body)
    if (req.body) {

        var payload = req.body

        var responseArray = []

        for (const iterator of payload.studentData) {

            const did = await middleware.generateDid();

            console.log("did", did)

            console.log("id", did[0].verificationMethod[0].controller)
            var didId = did[0].verificationMethod[0].controller

            iterator.did = didId
            iterator.grade = payload.grade
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

        const promises = []

        for (const iterator of payload.studentData) {

            const did = await middleware.generateDid();

            console.log("did", did)

            console.log("id", did[0].verificationMethod[0].controller)
            var didId = did[0].verificationMethod[0].controller

            iterator.did = didId
            iterator.grade = payload.grade
            console.log("iterator", iterator)


            promises.push(middleware.issueCredentials(iterator))  
        }

        Promise.all(promises)
           .then((results) => {
               console.log("All done", results);
               resp.successGetResponse(res, results, 'api response');
           })
           .catch((e) => {
               // Handle errors here
           });
    }

})