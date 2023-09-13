import { Injectable, StreamableFile } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';

//custom imports
import jwt_decode from 'jwt-decode';
import { createWriteStream, writeFile } from 'fs';
import { Response, Request } from 'express';
import * as wkhtmltopdf from 'wkhtmltopdf';
import { AadharService } from '../services/aadhar/aadhar.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { CredService } from 'src/services/cred/cred.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
const qr = require('qrcode');
const { parse, HTMLElement } = require('node-html-parser');

const path = require('path');
import sharp from 'sharp';
import { join } from 'path';
import { log } from 'console';
const zlib = require('zlib');
const htmlMinifier = require('html-minifier');

const jsdom = require('jsdom');
const handlebars = require('handlebars');
const fs = require('fs');
const crypto = require('crypto');
const jQuery = require('jquery');
const cheerio = require('cheerio');

const minimize = require('minimize');
@Injectable()
export class SSOService {
  public codeVerifier: string;
  constructor(
    private readonly httpService: HttpService,
    private aadharService: AadharService,
    private sbrcService: SbrcService,
    private credService: CredService,
    private keycloakService: KeycloakService,
  ) {}
  //axios call
  md5 = require('md5');
  moment = require('moment');
  qs = require('qs');

  //getAadhaarEkyc
  async getAadhaarEkyc(response: Response, aadhaar_id: string) {
    if (aadhaar_id) {
      return response.status(200).send({
        success: true,
        status: 'aadhaar_api_success',
        message: 'Aadhar API Working',
        result: { uuid: aadhaar_id, otp: '1234' },
      });
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received All Parameters.',
        result: null,
      });
    }
  }

}
