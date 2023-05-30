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
    let ngrokUrl;
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

    // Create an HTTP server
    const server = http.createServer(handleStream);

    // Find the next available port
    const port = await findAvailablePort(3000);

    // Start the server and expose it with ngrok
    await new Promise((resolve, reject) => {
      server.listen(port, async () => {
        console.log(`Server is running on port ${port}`);

        try {
           ngrokUrl = await ngrok.connect({
            authtoken: '2KVGmlxJUHWrgTXlIU9wtesvpM3_39DmFsdbs5eBcQsustWvy',
            addr: port, // Use the available port
            region: 'in', // Replace with your desired ngrok region
          });

          console.log('ngrok connected:', ngrokUrl);

          // Close ngrok connection when Node.js exits
          process.on('exit', () => {
            ngrok.kill();
          });

          resolve({
            statusCode: 200,
            body: ngrokUrl,
          });
        } catch (error) {
          console.error('Error starting ngrok:', error);
          reject({
            statusCode: 500,
            body: 'Internal Server Error',
          });
        }
      });
    });

    return {
      statusCode: 200,
      body: `ngrokUrl : ${ngrokUrl}`,
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
