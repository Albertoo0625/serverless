async function geturl() {
  try {
    const functiongeturlLocation = "/.netlify/functions/handlerequest";
    const response = await fetch(functiongeturlLocation, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json(); // Parse the response JSON
    const url = data.url; // Extract the URL from the response

    console.log('Received URL:', url);

    // Call the serverless function with the received URL
    const result=await callServerlessFunction(url);

    console.log(result);

    console.log('callserverlessfunction Called');
  } catch (error) {
    console.error('Error in geturl:', error);
  }
}

geturl();




async function callServerlessFunction(url) {
  try {
    const functionLocation="/.netlify/functions/stream";
    const response = await fetch(functionLocation, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    const data=console.log(response.data)
    
    console.log('Serverless function response:', data);
    // Process the response data as needed
  } catch (error) {
    console.error('Error calling serverless function:', error);
  }
}


