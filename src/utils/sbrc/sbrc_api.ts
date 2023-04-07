//custom imports
import axios from 'axios';

// invite entity in registery
export const sbrcInvite = async (inviteSchema, entityName) => {
  let data = JSON.stringify(inviteSchema);

  let config_sb_rc = {
    method: 'post',
    url: process.env.REGISTRY_URL + 'api/v1/' + entityName + '/invite',
    headers: {
      'content-type': 'application/json',
    },
    data: data,
  };

  var sb_rc_response_text = null;
  await axios(config_sb_rc)
    .then(function (response) {
      //console.log(JSON.stringify(response.data));
      sb_rc_response_text = response.data;
    })
    .catch(function (error) {
      //console.log(error);
      sb_rc_response_text = { error: error };
    });

  return sb_rc_response_text;
};

// update entity in registery
export const sbrcUpdate = async (updateSchema, entityName, osid) => {
  let data = JSON.stringify(updateSchema);

  let config_sb_rc = {
    method: 'put',
    url: process.env.REGISTRY_URL + 'api/v1/' + entityName + '/' + osid,
    headers: {
      'content-type': 'application/json',
    },
    data: data,
  };

  var sb_rc_response_text = null;
  await axios(config_sb_rc)
    .then(function (response) {
      //console.log(JSON.stringify(response.data));
      sb_rc_response_text = response.data;
    })
    .catch(function (error) {
      //console.log(error);
      sb_rc_response_text = { error: error };
    });

  return sb_rc_response_text;
};

// search entity in registery
export const sbrcSearch = async (entity: string, filter: any) => {
  let data = JSON.stringify(filter);

  let url = process.env.REGISTRY_URL + 'api/v1/' + entity + '/search';
  //console.log(data + ' ' + url);
  let config = {
    method: 'post',
    url: url,
    headers: {
      'Content-Type': 'application/json',
    },
    data: data,
  };
  let sb_rc_search = null;
  await axios(config)
    .then(function (response) {
      //console.log(JSON.stringify(response.data));
      sb_rc_search = response.data;
    })
    .catch(function (error) {
      //console.log(error);
      sb_rc_search = { error: error };
    });
  return sb_rc_search;
};
