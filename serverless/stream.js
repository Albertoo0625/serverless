const axios = require('axios');
const { pipeline } = require('stream');
const ngrok = require('ngrok');
const http = require('http');

exports.handler = async (event, context) => {
  try {
    const { url } = JSON.parse(event.body);
    if (!url) {
      return {
        statusCode: 400,
        body: 'Missing URL parameter',
      };
    }

    const response = await axios.get(url, {
      responseType: 'stream',
    });

    // Create an HTTP server
    const server = http.createServer((req, res) => {
      res.setHeader('Content-Type', response.headers['content-type']);
      res.setHeader('Transfer-Encoding', 'chunked');

      pipeline(response.data, res, (error) => {
        if (error) {
          console.error('Pipeline encountered an error:', error);
        }
      });
    });

    // Start the server and expose it with ngrok
    server.listen(3000, async () => {
      console.log('Server is running on port 3000');

      try {
        const ngrokUrl = await ngrok.connect({
          authtoken: '2KVGmlxJUHWrgTXlIU9wtesvpM3_39DmFsdbs5eBcQsustWvy', // Replace with your ngrok authtoken
          addr: 3000, // Replace with the port of your local server
          region: 'in', // Replace with your desired ngrok region
        });

        console.log('ngrok connected:', ngrokUrl);

        // Return the ngrok URL along with the response
        return {
          statusCode: 200,
          body: JSON.stringify({ url: ngrokUrl }),
        };
      } catch (error) {
        console.error('Error starting ngrok:', error);
        return {
          statusCode: 500,
          body: 'Internal Server Error',
        };
      }
    });
  } catch (error) {
    console.error('Error handling stream:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
