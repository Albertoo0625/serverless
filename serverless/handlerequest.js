const axios = require('axios');
const { pipeline } = require('stream');
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

        // Set the appropriate headers for the response
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Transfer-Encoding', 'chunked');

        pipeline(response.data, res, (error) => {
          if (error) {
            console.error('Pipeline encountered an error:', error);
          }
        });
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

    const serverUrl = `https://${process.env.NETLIFY_SITE_ID}.netlify.app`;
    const endpoint = serverUrl + context.path;

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
