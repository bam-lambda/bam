// handler is the name of the function being exported; it's best to leave as the default.
exports.handler = async (event, context) => {
  // setup code
  const queryParams = event.queryStringParameters;
  const pathParams = event.pathParameters;
  const stageVariables = event.stageVariables;

  // what the page will show
  const html = '';

  // DO NOT DELETE
  // return value must be proper http response with content-type set to text/html
  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: html,
  };
};

/* information about the event and context handler parameters:

    1. event (JSON object containing info about the event and the source that triggered the lambda):
        resource
        path
        httpMethod
        headers
        queryStringParameters
        pathParameters
        stageVariables
        requestContext: {
          resourceId
          resourcePath
          extendedRequestId
          requestTime
          path
          accountId
          protocol
          stage
          domainPrefix
          requestTimeEpoch
          requestId
          identity
          domainName
          apiId
        }

    2. context (JSON object containing info about the lambda's runtime):
        functionName: name of the lambda
        functionVersion
        invokedFunctionArn
        memoryLimitInMB
        awsRequestId
        logGroupName
        logStreamName
        identity: Amazon Cognito identity if available
        clientContext: info about device if invoked from mobile */
