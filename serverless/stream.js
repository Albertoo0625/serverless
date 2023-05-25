const axios = require('axios');


exports.handler = async (event, context) => {
  try {
    const { url } = JSON.parse(event.body);

    console.log(`stream url ${url}`)

    if (!url) {
      return {
        statusCode: 400,
        body: 'Missing URL parameter',
      };
    }

    const response = await axios.get(url, {
      responseType: 'stream',
    });

    // Set the appropriate headers for the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': response.headers['content-type'],
        'Transfer-Encoding': 'chunked',
      },
      body: response.data,
      isBase64Encoded: false,
    };
  } catch (error) {
    console.error('Error handling stream:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
