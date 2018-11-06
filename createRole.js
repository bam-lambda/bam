// pull in config.json
// createPolicy based on user config
// from init.js createRole
const AWS = require('aws-sdk');
const { promisify } = require('util');

const iam = new AWS.IAM();

const promiseTryCatch = async (asyncFunc) => {
  let result;
  try {
    result = await asyncFunc();
  } catch (err) {
    return console.error(err);
  }
  return result;
};

module.exports = (accountId, region) => {
  const defaultBamPolicyTemplate = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 'logs:CreateLogGroup',
        Resource: `arn:aws:logs:${region}:${accountId}:*`
      },
      {
        Effect: 'Allow',
        Action: [
          'logs:CreateLogStream',
          'logs:PutLogEvents'
        ],
        Resource: [
          `arn:aws:logs:${region}:${accountId}:log-group:[[logGroups]]:*`
        ]
      }
    ]
  });

  const policyParams = {
    PolicyDocument: defaultBamPolicyTemplate, /* required */
    PolicyName: 'defaultBamPolicy', /* required */
  };

  const asyncCreatePolicy = promisify(iam.createPolicy.bind(iam, policyParams));

  const setRole = async () => {
    const policyData = await promiseTryCatch(asyncCreatePolicy);
    const policyArn = policyData.Policy.Arn;

    const rolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }
      ]
    };

    const roleParams = {
      RoleName: 'defaultBamRole',
      AssumeRolePolicyDocument: JSON.stringify(rolePolicy)
    };

    const asyncCreateRole = promisify(iam.createRole.bind(iam, roleParams));
    const roleData = await promiseTryCatch(asyncCreateRole);
    console.log(roleData);
  };

  setRole();
};
