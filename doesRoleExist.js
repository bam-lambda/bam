const AWS = require('aws-sdk');
const { promisify } = require('util');
const iam = new AWS.IAM();


module.exports = async function doesRoleExist(role) {
  const asyncGetRole = promisify(iam.getRole.bind(iam));  

  try {
    await asyncGetRole({ RoleName: role });
    console.log(`${role} exists`);
    return true;
  } catch (err) {   
    return false;
  }
};