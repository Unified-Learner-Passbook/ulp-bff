//custom imports
import axios from 'axios';

//verify user token
export const verifyUserToken = async (token: string) => {
  let config = {
    method: 'get',
    url:
      process.env.KEYCLOAK_URL +
      'realms/' +
      process.env.REALM_ID +
      '/protocol/openid-connect/userinfo',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: 'Bearer ' + token,
    },
  };

  let response_text = null;
  await axios(config)
    .then(function (response) {
      //console.log(JSON.stringify(response.data));
      response_text = response?.data;
    })
    .catch(function (error) {
      //console.log(error);
      response_text = { error: error };
    });

  return response_text;
};
