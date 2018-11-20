exports.handler = async () => {
  const html = '<h1>This is a test</h1>';

  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: html,
  };
};
