import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { HttpService } from '@nestjs/axios';
import { response } from 'express';
import { SbrcService } from 'src/services/sbrc/sbrc.service';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
import { CredService } from 'src/services/cred/cred.service';
import { Response, Request } from 'express';

@Injectable()
export class ClaimAttestService {
  constructor(
    private readonly httpService: HttpService,
    private sbrcService: SbrcService,
    private keycloakService: KeycloakService,
    private credService: CredService,
  ) {}
  moment = require('moment');

  public test() {
    console.log('Test Function Success');
  }
  public async sent(
    token: string,
    attest_school_id: string,
    attest_school_name: string,
    credential_schema_id: string,
    credentialSubject: object,
    response: Response,
  ) {
    if (
      token &&
      attest_school_id &&
      attest_school_name &&
      credential_schema_id &&
      credentialSubject
    ) {
      const learnerUsername = await this.keycloakService.getUserTokenAccount(
        token,
      );

      if (learnerUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!learnerUsername?.username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        let name = '';
        let dob = '';
        let gender = '';
        if (
          learnerUsername?.attributes?.gender &&
          learnerUsername?.attributes?.dob &&
          learnerUsername?.attributes?.name
        ) {
          //login with digilocker
          name = learnerUsername?.attributes?.name[0];
          dob = await this.convertDate(learnerUsername?.attributes?.dob[0]);
          gender = learnerUsername?.attributes?.gender[0];
        } else {
          //login with mobile and otp
          const sb_rc_search = await this.sbrcService.sbrcSearchEL('Learner', {
            filters: {
              username: {
                eq: learnerUsername?.username,
              },
            },
          });

          if (sb_rc_search?.error) {
            return response.status(501).send({
              success: false,
              status: 'sb_rc_search_error',
              message: 'System Search Error ! Please try again.',
              result: sb_rc_search?.error.message,
            });
          } else if (sb_rc_search.length === 0) {
            return response.status(404).send({
              success: false,
              status: 'sb_rc_search_no_found',
              message: 'Data Not Found in System.',
              result: null,
            });
          } else {
            name = sb_rc_search[0].name;
            dob = sb_rc_search[0].dob;
            gender = sb_rc_search[0].gender;
          }
        }
        //search count
        let searchSchema = {
          filters: {
            name: {
              eq: name,
            },
            dob: {
              eq: dob,
            },
            gender: {
              eq: gender,
            },
          },
        };

        const learnerDetails = await this.sbrcService.sbrcSearch(
          searchSchema,
          'Learner',
        );

        if (learnerDetails.length == 0) {
          //register in keycloak and then in sunbird rc
          return response.status(400).send({
            success: false,
            status: 'sbrc_instructor_no_found_error',
            message: 'Learner Account Not Found. Register and Try Again.',
            result: null,
          });
        } else if (learnerDetails.length > 0) {
          //get count
          const osid = learnerDetails[0]?.osid;

          const requestbody = {
            attest_school_id: attest_school_id,
            attest_school_name: attest_school_name,
            credential_schema_id:credential_schema_id,
            credentialSubject:credentialSubject,
            claim_by: osid,
            claim_status:'raise',
            claim_from: 'Learner',
            attest_by: '',
            attest_from: '',
          };

          let sbrcInviteResponse = await this.sbrcService.sbrcInviteEL(
            requestbody,
            'ClaimAttestSchema',
          );

          console.log('sbrcInvite' + JSON.stringify(sbrcInviteResponse));

          return response.status(200).send({
            success: true,
            status: 'claim_attest success',
            message: 'ClaimAttest Success',
            result: null,
          });
        } else {
          return response.status(200).send({
            success: false,
            status: 'sbrc_search_error',
            message: 'Unable to search Learner. Try Again.',
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
  public search() {
    
    console.log('Search Function Success');
  }
  public attest() {
    console.log('Attest Function Success');
  }
  //helper function
  //get convert date and repalce character from string
  async convertDate(datetime) {
    if (!datetime) {
      return '';
    }
    let date_string = datetime.substring(0, 10);
    const datetest = this.moment(date_string, 'DD/MM/YYYY').format(
      'DD/MM/YYYY',
    );
    return datetest;
  }
}