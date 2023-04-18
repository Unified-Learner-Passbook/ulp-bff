import { Injectable, StreamableFile } from '@nestjs/common';

//custom imports
import axios from 'axios';
import { Response, Request } from 'express';

@Injectable()
export class SchoolService {
  //axios call
  md5 = require('md5');
  crypto = require('crypto');
  fs = require('fs');
  x509 = require('x509.js');
  convert = require('json-to-plain-text');
  forge = require('node-forge');

  //schoolVerify
  async schoolVerify(requestbody: any, response: Response) {
    if (requestbody) {
      const appKey = await this.getAppKey();
      ////console.log('appKey', appKey);
      const PLAIN_JSON = {
        clientId: 'test',
        clientSecret: 'test@123',
        appKey: appKey,
      };
      ////console.log(PLAIN_JSON);
      const PLAIN_TEXT_JSON = JSON.stringify(PLAIN_JSON);
      //console.log(PLAIN_TEXT_JSON);
      const base64_plaintextjson = await Buffer.from(PLAIN_TEXT_JSON).toString(
        'base64',
      );
      //console.log('base64_plaintextjson', base64_plaintextjson);
      const cert_path = __dirname + '/src/assets/cert/udiseplusapi.cer';
      const public_key = await this.getPublicKeyFromCert(cert_path);
      //console.log('public_key', public_key);
      const encryptedBuffer = await this.encryptCer(
        base64_plaintextjson,
        public_key,
      );
      //console.log('encryptedBuffer', encryptedBuffer);
      const hex_encryptedBuffer = await this.bytesToHex(encryptedBuffer);
      //console.log('hex_encryptedBuffer', hex_encryptedBuffer);

      //call gov api
      let data = {
        data: hex_encryptedBuffer,
      };

      let config = {
        method: 'post',
        url: 'https://api.udiseplus.gov.in/school/v1.2/authenticate',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      };
      //console.log('config', config);
      let response_text = null;
      await axios(config)
        .then(function (response) {
          //console.log(JSON.stringify(response.data));
          response_text = response.data;
        })
        .catch(function (error) {
          ////console.log(error);
          response_text = { error: error };
        });

      if (response_text?.error || response_text?.status === false) {
        return response.status(200).send({
          status: false,
          response: response_text,
        });
      } else {
        let authtoken = response_text?.data?.authToken;
        let sek = response_text?.data?.sek;
        //console.log('sek', sek);
        //console.log('appKey', appKey);
        ////console.log('authtoken', authtoken);
        if (authtoken && sek) {
          let dsek = await Buffer.from(sek, 'base64').toString('utf8');
          //console.log('dsek', dsek);
          let decryptedSek = await this.decrypt(dsek, appKey);
          //console.log('decryptedSek', decryptedSek);
          let objStr = JSON.stringify(requestbody);
          //console.log('objStr', objStr);
          let et = await this.encrypt(objStr, decryptedSek);
          //console.log('et', et);
          /*let etBase64 = await Buffer.from(et).toString('base64');
          //console.log('etBase64', etBase64);*/

          const encryptedRequestBody = {
            data: et,
          };
          let config_token = {
            method: 'post',
            url: 'https://api.udiseplus.gov.in/school/v1.1/school-info/by-udise-code/public',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + authtoken,
            },
            data: encryptedRequestBody,
          };
          //console.log('config_token', config_token);
          let response_text = null;
          await axios(config_token)
            .then(function (response) {
              //console.log(JSON.stringify(response.data));
              response_text = response.data;
            })
            .catch(function (error) {
              ////console.log(error);
              response_text = { error: error };
            });

          if (response_text?.error || response_text?.status === false) {
            return response.status(200).send({
              status: false,
              response: response_text,
            });
          } else {
            return response.status(200).send({
              status: true,
              response: response_text,
            });
          }
        } else {
          return response.status(200).send({
            status: false,
            response: response_text,
          });
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }

  //helper function
  async getAppKey() {
    const key = await this.crypto.randomBytes(32); // Generate a 256-bit key (32 bytes)
    const encodedKey = await key.toString('base64');
    return encodedKey;
  }
  async getPublicKeyFromCert(certPath) {
    const certData = await this.fs.readFileSync(certPath);
    ////console.log(certData);
    //const cert = this.x509.parseCert(certData);
    ////console.log(cert);
    //const publicKey = cert.publicKey;
    //const publicKey = cert.publicModulus;
    //const publicKey = { algorithm: 'sha256WithRSAEncryption' };

    const publicKey = await this.crypto
      .createPublicKey(certData)
      //for public key
      .export({ type: 'spki', format: 'pem' });
    //for rsa public key
    //.export({ type: 'pkcs1', format: 'pem' });
    ////console.log(publicKey);

    return publicKey;
  }
  async encryptCer(text, publicKeyPem) {
    const buffer = await Buffer.from(text, 'utf8');
    ////console.log(buffer);
    const encrypted = await this.crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: this.crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer,
    );
    ////console.log(encrypted);
    return encrypted;
  }
  async decrypt(text, secretKey) {
    const key = await Buffer.from(secretKey, 'base64');
    const decipher = await this.crypto.createDecipheriv(
      'aes-256-ecb',
      key,
      null,
    );
    const decrypted = await Buffer.concat([
      decipher.update(Buffer.from(text, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
  async encrypt(text, secretKey) {
    const key = await Buffer.from(secretKey, 'base64');
    const cipher = await this.crypto.createCipheriv('aes-256-ecb', key, null);
    const encrypted = await Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    return encrypted.toString('base64');
  }
  async bytesToHex(bytes) {
    return await Buffer.from(bytes).toString('hex');
  }
  async hexToBytes(hexString) {
    return await Buffer.from(hexString, 'hex');
  }
}
