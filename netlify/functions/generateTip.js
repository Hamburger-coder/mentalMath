// Netlify serverless function to generate math tips from Hugging Face API
// No need to import fetch - it's available globally in Edge Functions

exports.handler = async function(event, context) {
  console.log("Function invoked:", context.functionName);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log("Method not allowed:", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Parse the incoming request body
    const requestBody = JSON.parse(event.body);
    const mathProblem = requestBody.problem;
    
    console.log("Request received for problem:", mathProblem);
    
    if (!mathProblem) {
      console.log("Missing problem parameter");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing problem parameter' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Get the API key from environment variables
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error('ERROR: HUGGINGFACE_API_KEY environment variable is not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Server configuration error', 
          details: 'API key not found in environment variables'
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    console.log("API key present, preparing to call Hugging Face API");

    // Construct the prompt for the model
    const prompt = `Provide a math tip to help solve this problem faster: ${mathProblem}`;

    // Set up API URL and check if fetch is available
    const apiUrl = 'https://api-inference.huggingface.co/models/mrm8488/t5-base-finetuned-math-summarization';
    console.log("About to call Hugging Face API at:", apiUrl);
    
    if (typeof fetch !== 'function') {
      console.error("ERROR: fetch is not available in this environment");
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Server runtime error', 
          details: 'fetch API not available in this environment'
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Make request to Hugging Face Inference API
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 150,
            temperature: 0.7
          }
        })
      });

      console.log("Hugging Face API response status:", response.status);
      
      // Check for any non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed with status ${response.status}:`, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Successfully received data from Hugging Face API");
      
      // Return the result to the client
      return {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // Adjust for production
        }
      };
    } catch (fetchError) {
      console.error("Fetch operation failed:", fetchError);
      throw new Error(`Fetch operation failed: ${fetchError.message}`);
    }
    
  } catch (error) {
    console.error('Error in generateTip function:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error generating tip',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 