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
  async schoolVerify(school_udise: string, response: Response) {
    if (school_udise) {
      const aes_key = await this.getAESKey();
      console.log('aes_key', aes_key);
      const PLAIN_JSON = {
        clientId: 'test',
        clientSecret: 'test@123',
        appKey: aes_key,
      };
      console.log(PLAIN_JSON);
      //const PLAIN_TEXT_JSON = await this.convert.toPlainText(PLAIN_JSON);
      const PLAIN_TEXT_JSON = `clientId test
      clientSecret test@123
      appKey MDewisU3NguosAMPBidG3dLf0lyIFyyBkmNpkheMQow=`;
      //const PLAIN_TEXT_JSON =
      //'clientId test clientSecret test@123 appKey ' + aes_key;
      console.log(PLAIN_TEXT_JSON);
      const base64_plaintextjson = await Buffer.from(
        PLAIN_TEXT_JSON,
        'utf8',
      ).toString('base64');
      //const base64_plaintextjson = this.forge.util.encode64(PLAIN_TEXT_JSON);
      console.log('base64_plaintextjson', base64_plaintextjson);
      const cert_path = __dirname + '/assets/cert/udiseplusapi.cer';
      const public_key = await this.getPublicKeyFromCert(cert_path);
      console.log('public_key', public_key);
      //encrypt base64_plaintextjson by public_key
      let pki = this.forge.pki;
      var publicKey = pki.publicKeyFromPem(public_key);
      const encryptedBuffer = publicKey.encrypt(base64_plaintextjson);
      //const encryptedBuffer = this.forge.util.encode64(encrypted);
      /*const encryptedBuffer = await this.encrypt(
        base64_plaintextjson,
        public_key,
      );*/
      console.log('encryptedBuffer', encryptedBuffer);
      const hex_encryptedBuffer = await Buffer.from(
        encryptedBuffer,
        'base64',
      ).toString('hex');
      console.log('hex_encryptedBuffer', hex_encryptedBuffer);

      //call gov api
      var data = JSON.stringify({
        data: hex_encryptedBuffer,
      });

      var config = {
        method: 'post',
        url: 'https://api.udiseplus.gov.in/school/v1.2/authenticate',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      };
      let response_text = null;
      await axios(config)
        .then(function (response) {
          console.log(JSON.stringify(response.data));
          response_text = response.data;
        })
        .catch(function (error) {
          console.log(error);
          response_text = { error: error };
        });

      return response.status(200).send({
        response: response_text,
      });
      /*
      const hex_encryptedBuffer = Buffer.from(
        encryptedBuffer,
        'base64',
      ).toString('hex');*/
      /*return response.status(200).send({
        success: true,
        status: 'school_success',
        message: 'School Success',
        aes_key: aes_key,
        cert_path: cert_path,
        public_key: public_key,
        PLAIN_JSON: PLAIN_JSON,
        PLAIN_TEXT_JSON: PLAIN_TEXT_JSON,
        encryptedBuffer: encryptedBuffer,
        hex_encryptedBuffer: hex_encryptedBuffer,
      });*/
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
  getAESKey() {
    const key = this.crypto.randomBytes(32); // Generate a 256-bit key (32 bytes)
    const encodedKey = key.toString('base64');
    return encodedKey;
  }
  async getPublicKeyFromCert(certPath) {
    const certData = await this.fs.readFileSync(certPath);
    //console.log(certData);
    //const cert = this.x509.parseCert(certData);
    //console.log(cert);
    //const publicKey = cert.publicKey;
    //const publicKey = cert.publicModulus;
    //const publicKey = { algorithm: 'sha256WithRSAEncryption' };

    const publicKey = this.crypto
      .createPublicKey(certData)
      //for public key
      .export({ type: 'spki', format: 'pem' });
    //for rsa public key
    //.export({ type: 'pkcs1', format: 'pem' });
    //console.log(publicKey);

    return publicKey;
  }
  async encrypt(text, publicKeyPem) {
    const buffer = Buffer.from(text, 'utf8');
    //console.log(buffer);
    const encrypted = await this.crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: this.crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer,
    );
    //console.log(encrypted);
    return encrypted;
  }
}
