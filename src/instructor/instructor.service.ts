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
export class InstructorService {
  constructor(
    private credService: CredService,
    private sbrcService: SbrcService,
    private telemetryService: TelemetryService,
    private aadharService: AadharService,
    private keycloakService: KeycloakService,
    private readonly httpService: HttpService, //private usersService: UsersService,
  ) {}

  moment = require('moment');
  fs = require('fs');
  async = require('async');

  //instructor
  //q1
  //registerQ1Instructor
  async registerQ1Instructor(
    name: string,
    dob: string,
    gender: string,
    recoveryphone: string,
    issuer_did: string,
    username: string,
    email: string,
    kyc_aadhaar_token: string,
    school_name: string,
    school_id: string,
    school_mobile: string,
    response: Response,
  ) {
    if (
      name &&
      dob &&
      gender &&
      recoveryphone &&
      issuer_did &&
      username &&
      email &&
      kyc_aadhaar_token &&
      school_name &&
      school_mobile &&
      school_id
    ) {
      // find student
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
      const instructorDetails = await this.sbrcService.sbrcSearch(
        searchSchema,
        'Instructor',
      );
      console.log('Instructor Details', instructorDetails);
      if (instructorDetails.length == 0) {
        //register in keycloak and then in sunbird rc
        //create keycloak and then login
        const clientToken = await this.keycloakService.getClientToken();
        console.log('clientToken', clientToken);
        if (clientToken?.error) {
          return response.status(401).send({
            success: false,
            status: 'keycloak_client_token_error',
            message: 'System Authentication Failed ! Please Try Again.',
            result: null,
          });
        } else {
          ///register in keycloak
          let response_text = await this.keycloakService.registerUserKeycloak(
            username,
            '4163416&V&7wve72',
            clientToken,
          );
          console.log('registerUserKeycloak', response_text);
          //generate did
          let instructor_did = '';
          let didRes = await this.credService.generateDid(username + name);
          if (didRes) {
            instructor_did = didRes[0].verificationMethod[0].controller;
            //register and create account in sunbird rc
            let inviteSchema = {
              name: name,
              dob: dob,
              gender: gender,
              did: instructor_did,
              username: username,
              aadhaar_token: '',
              kyc_aadhaar_token: kyc_aadhaar_token,
              recoveryphone: recoveryphone,
              issuer_did: issuer_did,
              school_name: school_name,
              school_id: school_id,
              school_mobile: school_mobile,
              email: email,
            };
            console.log('inviteSchema', inviteSchema);
            let createInstructor = await this.sbrcService.sbrcInvite(
              inviteSchema,
              'Instructor',
            );
            console.log('createInstructor', createInstructor);
            if (createInstructor) {
              return response.status(200).send({
                success: true,
                status: 'sbrc_register_success',
                message: 'User Account Registered.',
                result: null,
              });
            } else {
              return response.status(400).send({
                success: false,
                status: 'sbrc_invite_error',
                message: 'Unable to Register Instructor. Try Again.',
                result: null,
              });
            }
          } else {
            return response.status(400).send({
              success: false,
              status: 'did_generate_fail',
              message: 'Unable to Generate Instructor DID ! Please Try Again.',
              result: null,
            });
          }
        }
      } else if (instructorDetails.length > 0) {
        if (instructorDetails[0].username != '') {
          return response.status(400).send({
            success: false,
            status: 'sbrc_register_duplicate',
            message: `You entered account details already linked to an existing Keycloak account, which has a mobile number ${instructorDetails[0].username}. You cannot set a new mobile number for this account detail. Login using the linked mobile number and otp.`,
            result: null,
          });
        } else {
          //register in keycloak and then update username
          //register in keycloak
          //create keycloak and then login
          const clientToken = await this.keycloakService.getClientToken();
          if (clientToken?.error) {
            return response.status(401).send({
              success: false,
              status: 'keycloak_client_token_error',
              message: 'System Authentication Failed ! Please Try Again.',
              result: null,
            });
          } else {
            ///register in keycloak
            let response_text = await this.keycloakService.registerUserKeycloak(
              username,
              '4163416&V&7wve72',
              clientToken,
            );
            //update username and register in keycloak
            //update username
            let updateRes = await this.sbrcService.sbrcUpdate(
              { username: username, kyc_aadhaar_token: kyc_aadhaar_token },
              'Instructor',
              instructorDetails[0].osid,
            );
            if (updateRes) {
              return response.status(200).send({
                success: true,
                status: 'sbrc_register_success',
                message:
                  'User Account Registered. Login using mobile number and otp.',
                result: null,
              });
            } else {
              return response.status(200).send({
                success: false,
                status: 'sbrc_update_error',
                message:
                  'Unable to Update Instructor Username ! Please Try Again.',
                result: null,
              });
            }
          }
        }
      } else {
        return response.status(200).send({
          success: false,
          status: 'sbrc_search_error',
          message: 'Unable to search Instructor. Try Again.',
          result: null,
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
  //q2
  //registerInstructor
  async registerInstructor(
    name: string,
    dob: string,
    gender: string,
    recoveryphone: string,
    issuer_did: string,
    username: string,
    email: string,
    response: Response,
  ) {
    if (
      name &&
      dob &&
      gender &&
      recoveryphone &&
      issuer_did &&
      username &&
      email
    ) {
      // find student
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
      const instructorDetails = await this.sbrcService.sbrcSearch(
        searchSchema,
        'Instructor',
      );
      console.log('Instructor Details', instructorDetails);
      if (instructorDetails.length == 0) {
        //register in keycloak and then in sunbird rc
        //create keycloak and then login
        const clientToken = await this.keycloakService.getClientToken();
        console.log('clientToken', clientToken);
        if (clientToken?.error) {
          return response.status(401).send({
            success: false,
            status: 'keycloak_client_token_error',
            message: 'System Authentication Failed ! Please Try Again.',
            result: null,
          });
        } else {
          ///register in keycloak
          let response_text = await this.keycloakService.registerUserKeycloak(
            username,
            '4163416&V&7wve72',
            clientToken,
          );
          console.log('registerUserKeycloak', response_text);
          //generate did
          let instructor_did = '';
          let didRes = await this.credService.generateDid(username + name);
          if (didRes) {
            instructor_did = didRes[0].verificationMethod[0].controller;
            //register and create account in sunbird rc
            let inviteSchema = {
              name: name,
              dob: dob,
              gender: gender,
              did: instructor_did,
              username: username,
              aadhaar_token: '',
              kyc_aadhaar_token: '',
              recoveryphone: recoveryphone,
              issuer_did: issuer_did,
              school_name: '',
              school_id: '',
              school_mobile: '',
              email: email,
            };
            console.log('inviteSchema', inviteSchema);
            let createInstructor = await this.sbrcService.sbrcInvite(
              inviteSchema,
              'Instructor',
            );
            console.log('createInstructor', createInstructor);
            if (createInstructor) {
              return response.status(200).send({
                success: true,
                status: 'sbrc_register_success',
                message: 'User Account Registered.',
                result: null,
              });
            } else {
              return response.status(400).send({
                success: false,
                status: 'sbrc_invite_error',
                message: 'Unable to Register Instructor. Try Again.',
                result: null,
              });
            }
          } else {
            return response.status(400).send({
              success: false,
              status: 'did_generate_fail',
              message: 'Unable to Generate Instructor DID ! Please Try Again.',
              result: null,
            });
          }
        }
      } else if (instructorDetails.length > 0) {
        if (instructorDetails[0].username != '') {
          return response.status(400).send({
            success: false,
            status: 'sbrc_register_duplicate',
            message: `You entered account details already linked to an existing Keycloak account, which has a mobile number ${instructorDetails[0].username}. You cannot set a new mobile number for this account detail. Login using the linked mobile number and otp.`,
            result: null,
          });
        } else {
          //register in keycloak and then update username
          //register in keycloak
          //create keycloak and then login
          const clientToken = await this.keycloakService.getClientToken();
          if (clientToken?.error) {
            return response.status(401).send({
              success: false,
              status: 'keycloak_client_token_error',
              message: 'System Authentication Failed ! Please Try Again.',
              result: null,
            });
          } else {
            ///register in keycloak
            let response_text = await this.keycloakService.registerUserKeycloak(
              username,
              '4163416&V&7wve72',
              clientToken,
            );
            //update username and register in keycloak
            //update username
            let updateRes = await this.sbrcService.sbrcUpdate(
              { username: username },
              'Instructor',
              instructorDetails[0].osid,
            );
            if (updateRes) {
              return response.status(200).send({
                success: true,
                status: 'sbrc_register_success',
                message:
                  'User Account Registered. Login using mobile number and otp.',
                result: null,
              });
            } else {
              return response.status(200).send({
                success: false,
                status: 'sbrc_update_error',
                message:
                  'Unable to Update Instructor Username ! Please Try Again.',
                result: null,
              });
            }
          }
        }
      } else {
        return response.status(200).send({
          success: false,
          status: 'sbrc_search_error',
          message: 'Unable to search Instructor. Try Again.',
          result: null,
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
  //getAadhaarTokenUpdate
  async getAadhaarTokenUpdate(
    token: string,
    response: Response,
    aadhaar_id: string,
  ) {
    if (token && aadhaar_id) {
      const instructorUsername = await this.keycloakService.getUserTokenAccount(
        token,
      );
      if (instructorUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!instructorUsername?.username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        let aadhaar_name = '';
        let aadhaar_dob = '';
        let aadhaar_gender = '';
        if (
          instructorUsername?.attributes?.gender &&
          instructorUsername?.attributes?.dob &&
          instructorUsername?.attributes?.name
        ) {
          //login with digilocker
          aadhaar_name = instructorUsername?.attributes?.name[0];
          aadhaar_dob = await this.convertDate(
            instructorUsername?.attributes?.dob[0],
          );
          aadhaar_gender = instructorUsername?.attributes?.gender[0];
        } else {
          //login with mobile and otp
          const sb_rc_search = await this.sbrcService.sbrcSearchEL(
            'Instructor',
            {
              filters: {
                username: {
                  eq: instructorUsername?.username,
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
            aadhaar_name = sb_rc_search[0].name;
            aadhaar_dob = sb_rc_search[0].dob;
            aadhaar_gender = sb_rc_search[0].gender;
          }
        }
        //check aadhar id
        const aadhar_data = await this.aadharService.aadhaarDemographic(
          aadhaar_id,
          aadhaar_name,
          aadhaar_dob,
          aadhaar_gender,
        );
        //console.log(aadhar_data);
        if (!aadhar_data?.success === true) {
          return response.status(400).send({
            success: false,
            status: 'aadhaar_api_error',
            message: 'Aadhar API Not Working',
            result: aadhar_data?.result,
          });
        } else {
          if (aadhar_data?.result?.ret === 'y') {
            const decodedxml = aadhar_data?.decodedxml;
            const uuid = await this.aadharService.getUUID(decodedxml);
            if (uuid === null) {
              return response.status(400).send({
                success: false,
                status: 'aadhaar_api_uuid_error',
                message: 'Aadhar API UUID Not Found',
                result: uuid,
              });
            } else {
              //update uuid in user data
              // find student
              let searchSchema = {
                filters: {
                  name: {
                    eq: aadhaar_name,
                  },
                  dob: {
                    eq: aadhaar_dob,
                  },
                  gender: {
                    eq: aadhaar_gender,
                  },
                },
              };
              const instructorDetails = await this.sbrcService.sbrcSearch(
                searchSchema,
                'Instructor',
              );
              console.log('Instructor Details', instructorDetails);
              if (instructorDetails.length == 0) {
                //register in keycloak and then in sunbird rc
                return response.status(400).send({
                  success: false,
                  status: 'sbrc_instructor_no_found_error',
                  message:
                    'Instructor Account Not Found. Register and Try Again.',
                  result: null,
                });
              } else if (instructorDetails.length > 0) {
                //update kyc aadhar token
                //update username
                let updateRes = await this.sbrcService.sbrcUpdate(
                  { kyc_aadhaar_token: uuid },
                  'Instructor',
                  instructorDetails[0].osid,
                );
                if (updateRes) {
                  return response.status(200).send({
                    success: true,
                    status: 'aadhaar_api_success',
                    message: 'Aadhar API Working',
                    result: null,
                  });
                } else {
                  return response.status(200).send({
                    success: false,
                    status: 'sbrc_update_error',
                    message:
                      'Unable to Update Instructor Aadhaar KYC Token ! Please Try Again.',
                    result: null,
                  });
                }
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
            return response.status(200).send({
              success: false,
              status: 'invalid_aadhaar',
              message: 'Invalid Aadhaar',
              result: null,
            });
          }
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
  //getUDISEUpdate
  async getUDISEUpdate(
    token: string,
    response: Response,
    school_name: string,
    school_id: string,
    school_mobile: string,
  ) {
    if (token && school_name && school_id && school_mobile) {
      const instructorUsername = await this.keycloakService.getUserTokenAccount(
        token,
      );
      if (instructorUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!instructorUsername?.username) {
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
          instructorUsername?.attributes?.gender &&
          instructorUsername?.attributes?.dob &&
          instructorUsername?.attributes?.name
        ) {
          //login with digilocker
          name = instructorUsername?.attributes?.name[0];
          dob = await this.convertDate(instructorUsername?.attributes?.dob[0]);
          gender = instructorUsername?.attributes?.gender[0];
        } else {
          //login with mobile and otp
          const sb_rc_search = await this.sbrcService.sbrcSearchEL(
            'Instructor',
            {
              filters: {
                username: {
                  eq: instructorUsername?.username,
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
        //update udise in user data
        // find student
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
        const instructorDetails = await this.sbrcService.sbrcSearch(
          searchSchema,
          'Instructor',
        );
        console.log('Instructor Details', instructorDetails);
        if (instructorDetails.length == 0) {
          //register in keycloak and then in sunbird rc
          return response.status(400).send({
            success: false,
            status: 'sbrc_instructor_no_found_error',
            message: 'Instructor Account Not Found. Register and Try Again.',
            result: null,
          });
        } else if (instructorDetails.length > 0) {
          //update kyc aadhar token
          //update username
          let updateRes = await this.sbrcService.sbrcUpdate(
            {
              school_name: school_name,
              school_id: school_id,
              school_mobile: school_mobile,
            },
            'Instructor',
            instructorDetails[0].osid,
          );
          if (updateRes) {
            return response.status(200).send({
              success: true,
              status: 'udise_api_success',
              message: 'UDISE API Working',
              result: null,
            });
          } else {
            return response.status(200).send({
              success: false,
              status: 'sbrc_update_error',
              message:
                'Unable to Update Instructor UDISE Detail ! Please Try Again.',
              result: null,
            });
          }
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
  }
  //getDetailInstructor
  async getDetailInstructor(token: string, response: Response) {
    if (token) {
      const instructorUsername = await this.keycloakService.verifyUserToken(
        token,
      );
      if (instructorUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!instructorUsername?.preferred_username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        const sb_rc_search = await this.sbrcService.sbrcSearchEL('Instructor', {
          filters: {
            username: {
              eq: instructorUsername?.preferred_username,
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
          return response.status(200).send({
            success: true,
            status: 'sb_rc_search_found',
            message: 'Data Found in System.',
            result: sb_rc_search[0],
          });
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received token.',
        result: null,
      });
    }
  }
  //getDetailDigiInstructor
  async getDetailDigiInstructor(
    token: string,
    name: string,
    dob: string,
    gender: string,
    response: Response,
  ) {
    if (token && name && dob && gender) {
      const instructorUsername = await this.keycloakService.verifyUserToken(
        token,
      );
      if (instructorUsername?.error) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_bad_request',
          message: 'You do not have access for this request.',
          result: null,
        });
      } else if (!instructorUsername?.preferred_username) {
        return response.status(401).send({
          success: false,
          status: 'keycloak_token_error',
          message: 'Your Login Session Expired.',
          result: null,
        });
      } else {
        const sb_rc_search = await this.sbrcService.sbrcSearchEL('Instructor', {
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
          return response.status(200).send({
            success: true,
            status: 'sb_rc_search_found',
            message: 'Data Found in System.',
            result: sb_rc_search[0],
          });
        }
      }
    } else {
      return response.status(400).send({
        success: false,
        status: 'invalid_request',
        message: 'Invalid Request. Not received token.',
        result: null,
      });
    }
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
  //get jwt token information
  parseJwt = async (token): Promise<any> => {
    if (!token) {
      return {};
    }
    const decoded = jwt_decode(token);
    return decoded;
  };
}
