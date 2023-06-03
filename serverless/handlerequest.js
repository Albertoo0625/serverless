const axios = require('axios');
const { pipeline } = require('stream');
const ngrok = require('ngrok');
const http = require('http');

const findAvailablePort = async (port) => {
  const server = http.createServer();
  return new Promise((resolve, reject) => {
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(findAvailablePort(port + 1));
      } else {
        reject(error);
      }
    });
    server.listen(port, () => {
      server.close(() => {
        resolve(port);
      });
    });
  });
};

exports.handler = async (event, context) => {
  try {
    const requestBody = event.body;
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

    const port = await findAvailablePort(3000);

    const ngrokUrl = await ngrok.connect({
      authtoken: '2KVGmlxJUHWrgTXlIU9wtesvpM3_39DmFsdbs5eBcQsustWvy',
      addr: port,
      region: 'in',
    });

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ngrokUrl }),
    };
  } catch (error) {
    console.log('Error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
