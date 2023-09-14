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
    private credService: CredService
  ) {}

  public test() {
    console.log('Test Function Success');
  }
  public async sent(token: string,response:Response) {
    //verification of token
    // const username = await this.verifyToken(token);
    // if (username?.error) {
    //   return 'error1';
    // } else {
    //   //retieve data from sbrc
    //   const search = await this.sbrcService.sbrcSearchEL('Learner', {
    //     filters: {
    //       username: {
    //         eq: username?.preferred_username,
    //       },
    //     },
    //   });
    // }


    if (token) {
      const learnerUsername = await this.keycloakService.getUserTokenAccount(
        token,
      );
        //console.log(learnerUsername);
        
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
          dob = learnerUsername?.attributes?.dob[0];
          gender = learnerUsername?.attributes?.gender[0];
        } else {
          //login with mobile and otp
          const sb_rc_search = await this.sbrcService.sbrcSearchEL(
            'Learner',
            {
              filters: {
                username: {
                  eq: learnerUsername?.username,
                },
              },
            },
          );
          
          
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
        //console.log('Instructor Details', learnerDetails);
        console.log(learnerDetails+"learner details-------------");
        
        if (learnerDetails.length == 0) {
          //register in keycloak and then in sunbird rc
          return response.status(400).send({
            success: false,
            status: 'sbrc_instructor_no_found_error',
            message: 'Instructor Account Not Found. Register and Try Again.',
            result: null,
          });
        } else if (learnerDetails.length > 0) {
          //get count
          const osid = learnerDetails[0]?.osid;
          //count field start
          let countlog = {};
          for (let i = 0; i < learnerDetails.length; i++) {
            let field = learnerDetails[i];
            let fieldcount = 0;
            //students_registered
            //console.log('school_id', school_id);
            if (field === 'students_registered') {
              if (osid) {
                const searchFilter = await this.credService.credSearchFilter({
                  orgId: osid,
                });
                //console.log('searchFilter', searchFilter);
                try {
                  if (searchFilter?.error) {
                  } else {
                    fieldcount = searchFilter.length;
                  }
                } catch (e) {}
              }
            }
            //claims_pending
            if (field === 'claims_pending') {
              fieldcount = 0;
            }
            //claims_approved
            if (field === 'claims_approved') {
              fieldcount = 0;
            }
            //claims_rejected
            if (field === 'claims_rejected') {
              fieldcount = 0;
            }
            countlog[field] = fieldcount;
          }
          return response.status(200).send({
            success: true,
            status: 'count_success',
            message: 'Count Success',
            result: countlog,
          }); 
        } else {
          return response.status(200).send({
            success: false,
            status: 'sbrc_search_error',
            message: 'Unable to search Instructor. Try Again.',
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











    console.log('Sent Function Success');
  }
  public search() {
    console.log('Search Function Success');
  }
  public attest() {
    console.log('Attest Function Success');
  }
  async verifyToken(token: string) {
    if (token != null) {
      const url =
        process.env.KEYCLOAK_URL +
        'realms/' +
        process.env.REALM_ID +
        '/protocol/openid-connect/userinfo';

      console.log(url);

      const config: AxiosRequestConfig = {
        headers: {
          Authorization: token,
        },
      };
      let response_text = null;
      try {
        const observable = this.httpService.get(url, config);
        const promise = observable.toPromise();
        const response = await promise;
        //console.log(JSON.stringify(response.data));
        response_text = response.data;
      } catch (error) {
        //console.log(e);
        response_text = { error: error };
      }
      console.log(response_text);

      return response_text;
    }
  }
}
