() => {
  const html = '<h1>This is an invalid test</h1>';

  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: html,
  };
};
