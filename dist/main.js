const handleStream = async (req, res) => {
    try {
      const response = await axios.get(Rurl, {
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
  
  // Start the server and expose it with ngrok
  server.listen(3000, async () => {
    console.log('Server is running on port 3000');
  
    try {
      const url = await ngrok.connect({
        authtoken: '2KVGmlxJUHWrgTXlIU9wtesvpM3_39DmFsdbs5eBcQsustWvy',
        addr: 3000, // Replace with the port of your local server
        region: 'in' // Replace with your desired ngrok region
      });
  
      console.log('ngrok connected:', url);
  
      // Close ngrok connection when Node.js exits
      process.on('exit', () => {
        ngrok.kill();
      });
    } catch (error) {
      console.error('Error starting ngrok:', error);
    }
  });
  
  module.exports = { handleStream };
  