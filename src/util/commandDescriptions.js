const roleDesc = 'specifies role for this deployment';
const permitDbDesc = 'adds policy with scan, put, get, delete DynamoDB permissions';
const methodsDesc = 'specifies HTTP method(s) for the API Gateway';

module.exports = {
  deploy: {
    description: 'deploys lambda + endpoint',
    options: [
      { name: 'role', description: roleDesc },
      { name: 'permitDb', description: permitDbDesc },
      { name: 'methods', description: methodsDesc },
      { name: 'lambdaOnly', description: 'deploys lambda without an API gateway' },
    ],
    hasResource: true,
  },
  redeploy: {
    description: 'updates existing lambda and endpoint',
    options: [
      { name: 'role', description: roleDesc },
      { name: 'permitDb', description: permitDbDesc },
      { name: 'methods', description: methodsDesc },
      { name: 'rmmethods', description: 'specifies HTTP method(s) to be removed from the API Gateway' },
      { name: 'revokeDb', description: 'changes role associated with lambda to role specified in user config' },
      { name: 'addApi', description: 'adds API Gateway endpoint (if none exists) that is integrated with the lamdba' },
    ],
    hasResource: true,
  },
  create: {
    description: 'creates local file (or directory) based on template',
    options: [
      { name: 'html', description: 'creates local directory containing index.html, main.css, and [resourceName].js' },
      { name: 'invoker', description: 'creates local file/directory with [resourceName].js templated to invoke another lambda' },
    ],
    hasResource: true,
  },
  dbtable: {
    description: 'creates DynamoDB table',
    options: [],
    hasResource: true,
  },
  delete: {
    description: 'deletes existing lambda + endpoint',
    options: [
      { name: 'dbtable', description: 'deletes DynamoDB table' },
      { name: 'apiOnly', description: 'deletes only the API Gateway' },
      { name: 'lambdaOnly', description: 'deletes only the lambda' },
    ],
    hasResource: true,
  },
  get: {
    description: 'pulls lambda code from AWS into a local directory',
    options: [],
    hasResource: true,
  },
  list: {
    description: 'lists lambdas and tables deployed with BAM!',
    options: [
      { name: 'dbtables', description: 'lists only DynamoDB tables created with BAM!' },
      { name: 'lambdas', description: 'lists only lambdas and associated API Gateway endpoints' },
    ],
    hasResource: false,
  },
  config: {
    description: 'updates default user settings',
    options: [],
    hasResource: false,
  },
};
