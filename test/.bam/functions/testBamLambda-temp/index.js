const uuid = require('uuid');
const util = require('util');
const moment = require('moment');

exports.handler = async () => {
  const uuidP = `<p>uuid${uuid.v4()}</p>`;
  const momentP = `<p>${moment('01/12/2016', 'DD/MM/YYYY', true).format()}</p>`;
  const utilP = `<p>${util.inspect({ cool: 'as ice' })}</p>`;

  const html = uuidP + momentP + utilP;

  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: html,
  };
};
