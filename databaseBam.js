// handler is the name of the function being exported; it's best to leave as the default.
exports.handler = async (event) => {
  // setup code
  const { httpMethod, queryStringParameters } = event;

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
