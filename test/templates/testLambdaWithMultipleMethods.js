exports.handler = async (event) => {
  let statusCode;
  switch(event.httpMethod) {
    case 'GET':
    case 'PUT':
      statusCode = 200;  
      break;
    case 'POST':
      statusCode = 201;
      break;    
    case 'DELETE':
      statusCode = 204;
      break;
    default:
      statusCode = 200;
  }
  
  return {
    statusCode,
  };
};
