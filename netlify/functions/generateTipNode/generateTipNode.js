// Netlify serverless function to generate math tips from Hugging Face API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
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
    
    if (!mathProblem) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing problem parameter' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Get the API key from environment variables
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error('HUGGINGFACE_API_KEY environment variable is not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Construct the prompt for the model
    const prompt = `Provide a math tip to help solve this problem faster: ${mathProblem}`;

    // Make request to Hugging Face Inference API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mrm8488/t5-base-finetuned-math-summarization',
      {
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
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Return the result to the client
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Adjust for production
      }
    };
    
  } catch (error) {
    console.error('Error generating tip:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error generating tip',
        message: error.message
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};

module.exports = { handler }; 