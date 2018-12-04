exports.handler = async () => {
  const html = 'The get command was used to retrieve this lambda';

  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: html,
  };
};
