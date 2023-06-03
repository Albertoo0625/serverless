const axios = require('axios');
const http = require('http');

exports.handler = async (event, context) => {
  try {
    const requestBody = JSON.parse(event.body);
    const url = requestBody.url;

    console.log(`REQUEST URL: ${url}`);

    const handleStream = async (req, res) => {
      try {
        const response = await axios.get(url, {
          responseType: 'stream',
        });

        // Get the stream data
        const stream = response.data;

        // Make a new HTTP request to the desired endpoint
        const endpoint = `https://${process.env.NETLIFY_SITE_ID}.netlify.app/${context.awsRequestId}`;
        await axios.post(endpoint, stream, {
          headers: {
            'Content-Type': 'audio/mpeg',
          },
        });

        // Send a success response
        res.statusCode = 200;
        res.end('Stream data passed to the endpoint successfully');
      } catch (error) {
        console.error('Error handling stream:', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    };

    const server = http.createServer(handleStream);

    server.listen(() => {
      const port = server.address().port;
      console.log(`Server is running on port ${port}`);
    });

    const endpoint = `https://${process.env.NETLIFY_SITE_ID}.netlify.app/${context.awsRequestId}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ endpoint }),
    };
  } catch (error) {
    console.log('Error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
