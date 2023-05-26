async function playStream(){
  try {
    const functiongeturlLocation = "/.netlify/functions/handlerequest";
    const response = await fetch(functiongeturlLocation, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }catch(err){
   console.log(err);
  }
}


