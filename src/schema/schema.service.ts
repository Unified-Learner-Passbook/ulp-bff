import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { Response } from 'express';
import { CredService } from 'src/services/cred/cred.service';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { TelemetryService } from 'src/services/telemetry/telemetry.service';
import { AadharService } from 'src/services/aadhar/aadhar.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
import jwt_decode from 'jwt-decode';
//import { UsersService } from 'src/services/users/users.service';
const { Readable } = require('stream');

@Injectable()
export class SchemaService {
  constructor(
    private credService: CredService,
    private sbrcService: SbrcService,
    private telemetryService: TelemetryService,
    private aadharService: AadharService,
    private keycloakService: KeycloakService,
    private readonly httpService: HttpService, //private usersService: UsersService,
  ) {}

  fs = require('fs');
  async = require('async');

  //schema
  //getCredentialSchemaCreate
  async getCredentialSchemaCreate(postrequest: any, response: Response) {
    if (postrequest) {
      const getschemacreate = await this.credService.schemaCreate(postrequest);
      if (getschemacreate?.error) {
        return response.status(400).send({
          success: false,
          status: 'get_schema_error',
          message: 'Get Schema Create Failed ! Please Try Again.',
          result: getschemacreate,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'schema_create_success',
          message: 'Schema Create Success',
          result: getschemacreate,
        });
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
  //getCredentialSchemaList
  async getCredentialSchemaList(postrequest: any, response: Response) {
    if (postrequest?.taglist) {
      console.log(postrequest.taglist);
      const getschemalist = await this.credService.schemaList(
        postrequest?.taglist,
      );
      if (getschemalist?.error) {
        return response.status(400).send({
          success: false,
          status: 'get_schema_error',
          message: 'Get Schema List Failed ! Please Try Again.',
          result: null,
        });
      } else {
        if (getschemalist.length > 0) {
          let schemalist = [];
          for (let i = 0; i < getschemalist.length; i++) {
            schemalist.push({
              schema_name: getschemalist[i]?.name,
              schema_id: getschemalist[i]?.id,
            });
          }
          return response.status(200).send({
            success: true,
            status: 'schema_list_success',
            message: 'Schema List Success',
            result: schemalist,
          });
        } else {
          return response.status(200).send({
            success: false,
            status: 'get_schema_list_no_found',
            message: 'Get Schema List Not Found ! Please Change Tags.',
            result: null,
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
  //getCredentialSchemaTemplateCreate
  async getCredentialSchemaTemplateCreate(
    postrequest: any,
    response: Response,
  ) {
    if (postrequest) {
      const getschematemplatecreate =
        await this.credService.schemaTemplateCreate(postrequest);
      if (getschematemplatecreate?.error) {
        return response.status(400).send({
          success: false,
          status: 'get_schema_template_error',
          message: 'Get Schema Template Create Failed ! Please Try Again.',
          result: getschematemplatecreate,
        });
      } else {
        return response.status(200).send({
          success: true,
          status: 'schema_template_create_success',
          message: 'Schema Template Create Success',
          result: getschematemplatecreate,
        });
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
  //getCredentialSchemaTemplateList
  async getCredentialSchemaTemplateList(postrequest: any, response: Response) {
    if (postrequest?.schema_id) {
      console.log(postrequest.schema_id);
      const getschematemplatelist = await this.credService.schemaTemplateList(
        postrequest?.schema_id,
      );
      if (getschematemplatelist?.error) {
        return response.status(400).send({
          success: false,
          status: 'get_schema_error',
          message: 'Get Schema Template List Failed ! Please Try Again.',
          result: getschematemplatelist,
        });
      } else {
        if (getschematemplatelist.length > 0) {
          let schematemplatelist = [];
          for (let i = 0; i < getschematemplatelist.length; i++) {
            schematemplatelist.push(getschematemplatelist[i]);
          }
          return response.status(200).send({
            success: true,
            status: 'schema_template_list_success',
            message: 'Schema Template List Success',
            result: schematemplatelist,
          });
        } else {
          return response.status(200).send({
            success: false,
            status: 'get_schema_template_list_no_found',
            message: 'Get Schema Template List Not Found !',
            result: getschematemplatelist,
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
  //getSchemaFields
  async getSchemaFields(schema_id: string, response: Response) {
    if (schema_id) {
      const getschema = await this.credService.generateSchema(schema_id);
      if (!getschema) {
        return response.status(400).send({
          success: false,
          status: 'get_schema_error',
          message: 'Get Schema Failed or Schema Not Found ! Please Try Again.',
          result: null,
        });
      } else {
        if (getschema?.schema?.required) {
          let schema_fields = getschema?.schema?.properties;
          let required_fileds = getschema?.schema?.required;
          let learner_schema_field =
            process.env.LEARNER_SCHEMA_FIELD.split(' ');
          for (let i = 0; i < learner_schema_field.length; i++) {
            if (!required_fileds.includes(learner_schema_field[i])) {
              required_fileds.push(learner_schema_field[i]);
            }
          }
          let allfields = Object.keys(schema_fields);
          let optional_fileds = [];
          for (let i = 0; i < allfields.length; i++) {
            let found = false;
            for (let j = 0; j < required_fileds.length; j++) {
              if (allfields[i] === required_fileds[j]) {
                found = true;
                break;
              }
            }
            if (!found) {
              optional_fileds.push(allfields[i]);
            }
          }

          let schema_result = {
            id: getschema?.id,
            name: getschema?.name,
            version: getschema?.version,
            author: getschema?.author,
            schemaid: getschema?.schema?.$id,
            required: required_fileds,
            optional: optional_fileds,
          };

          return response.status(200).send({
            success: true,
            status: 'schema_success',
            message: 'Schema Success',
            result: schema_result,
          });
        } else {
          return response.status(400).send({
            success: false,
            status: 'get_schema_error',
            message: 'Get Schema Required Failed ! Please Try Again.',
            result: null,
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
  //get jwt token information
  parseJwt = async (token): Promise<any> => {
    if (!token) {
      return {};
    }
    const decoded = jwt_decode(token);
    return decoded;
  };
}
