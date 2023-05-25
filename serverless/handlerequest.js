exports.handler = async (event, context) => {
    try {
      const requestBody = JSON.parse(event.body);
      const url = requestBody.url;
  
      console.log(`REQUEST URL: ${url}`);
  
      return {
        statusCode: 200,
        body: JSON.stringify({ url: url, message: 'URL received successfully' }),
      };
    } catch (error) {
      console.error('Error handling request:', error);
  
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      };
    }
  };
  