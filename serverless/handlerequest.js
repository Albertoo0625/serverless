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
  let ngrokUrl; // Declare ngrokUrl outside the try block

  try {
    const requestBody = JSON.parse(event.body);
    console.log(requestBody);
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
    const port = await findAvailablePort(4000);

    // Function to start the server and expose it with ngrok
    const startServer = async () => {
      return new Promise((resolve, reject) => {
        server.listen(port, async () => {
          console.log(`Server is running on port ${port}`);

          try {
            ngrok.kill();
            ngrokUrl = await ngrok.connect({
              authtoken: '2KVGmlxJUHWrgTXlIU9wtesvpM3_39DmFsdbs5eBcQsustWvy',
              addr: port, // Use the available port
              region: 'in', // Replace with your desired ngrok region
              host_header: 'rewrite',
              proto: 'http'
            });

            console.log('ngrok connected:', ngrokUrl);

            // Close ngrok connection when Node.js exits
            process.on('exit', () => {
              ngrok.kill();
            });

            resolve({
              statusCode: 200,
              body: JSON.stringify({
                ngrokUrl: ngrokUrl,
              }),
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
    };

    let retries = 0;
    const maxRetries = 2;

    // Function to handle retries
    const retry = async () => {
      try {
        ngrok.kill(); // Kill ngrok before retry
        return await startServer();
      } catch (error) {
        retries++;
        if (retries <= maxRetries && error.statusCode === 500) {
          console.log(`Retrying (${retries}/${maxRetries})...`);
          return await retry();
        } else {
          throw error;
        }
      }
    };

    // Start the server and expose it with ngrok (with retry functionality)
    const result = await retry();

    return result;
  } catch (error) {
    console.log(error);
    ngrok.kill();
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
