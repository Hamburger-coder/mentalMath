// Simple debug function to test environment setup
exports.handler = async function(event, context) {
  try {
    // Check for API key without exposing it fully
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const hasApiKey = apiKey ? "API key is set (starts with: " + apiKey.substring(0, 4) + "...)" : "API key is NOT set";

    // Return environment info
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Debug function executed successfully",
        environment: process.env.NODE_ENV,
        hasApiKey: hasApiKey,
        netlifyInfo: {
          functionName: context.functionName,
          netlifyIdentity: !!process.env.NETLIFY_IDENTITY_CONTEXT
        },
        eventInfo: {
          method: event.httpMethod,
          path: event.path,
          headers: Object.keys(event.headers)
        }
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 