exports.handler = async (event) => {
  const queryParams = event.queryStringParameters;
  const { name } = queryParams;

  const html = `<h1>${name}</h1>`;

  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: html,
  };
};
