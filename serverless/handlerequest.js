const axios = require('axios');
const http = require('http');

exports.handler = async (event, context) => {
  try {
    const requestBody = JSON.parse(event.body);
    const url = requestBody.url;

    console.log(`REQUEST URL: ${url}`);

    const serverPromise = new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        handleStream(req, res).catch(error => {
          console.error('Error handling stream:', error);
          res.statusCode = 500;
          res.end('Internal Server Error');
        });
      });

      server.listen(() => {
        const port = server.address().port;
        console.log(`Server is running on port ${port}`);
        resolve(server);
      });

      server.on('error', error => {
        reject(error);
      });
    });

    const handleStream = async (req, res) => {
      const response = await axios.get(url, {
        responseType: 'stream',
      });

      // Set the appropriate headers for the response
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Pipe the response data to the server response
      response.data.pipe(res);
    };

    const server = await serverPromise;
    const port = server.address().port;
    const serverUrl = `https://${process.env.NETLIFY_SITE_ID}.netlify.app:${port}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ serverUrl }),
    };
  } catch (error) {
    console.log('Error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
