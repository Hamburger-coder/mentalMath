// Simple function that returns math tips without external API calls
exports.handler = async function(event, context) {
  console.log("Simple function invoked:", context.functionName);
  
  // Accept POST requests only
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  try {
    // Parse the body
    const requestBody = JSON.parse(event.body);
    const mathProblem = requestBody.problem;
    
    if (!mathProblem) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing problem parameter' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }
    
    console.log("Generating tip for problem:", mathProblem);
    
    // Extract operation type and numbers from problem
    const parts = mathProblem.split(/\s+/);
    let tip = '';
    
    // Look for common patterns
    if (parts.length === 3) { // Simple binary operation
      const num1 = parseInt(parts[0]);
      const operator = parts[1];
      const num2 = parseInt(parts[2]);
      
      switch (operator) {
        case '+':
          if (num2 === 9 || num2 === 11) {
            tip = `When adding ${num2}, it's often easier to add 10 and then subtract/add 1.`;
          } else if (num1 % 10 + num2 % 10 >= 10) {
            tip = `Break this into easier parts: ${num1} + ${Math.floor(num2/10)*10} = ${num1 + Math.floor(num2/10)*10}, then add the remaining ${num2 % 10}.`;
          } else {
            tip = `Add the tens: ${Math.floor(num1/10)*10} + ${Math.floor(num2/10)*10} = ${Math.floor(num1/10)*10 + Math.floor(num2/10)*10}, then add the ones: ${num1 % 10} + ${num2 % 10} = ${num1 % 10 + num2 % 10}.`;
          }
          break;
        case '-':
          if (num2 === 9 || num2 === 11) {
            tip = `When subtracting ${num2}, try subtracting 10 first, then adjust by adding/subtracting 1.`;
          } else {
            tip = `Subtract the tens first: ${num1} - ${Math.floor(num2/10)*10} = ${num1 - Math.floor(num2/10)*10}, then subtract the ones: ${num1 - Math.floor(num2/10)*10} - ${num2 % 10} = ${num1 - num2}.`;
          }
          break;
        case '×':
        case '*':
          if (num1 === 5 || num2 === 5) {
            tip = `When multiplying by 5, divide by 2 and then multiply by 10. For example, ${Math.max(num1, num2)} × 5 = ${Math.max(num1, num2) / 2} × 10 = ${Math.max(num1, num2) * 5}.`;
          } else if (num1 === 9 || num2 === 9) {
            tip = `When multiplying by 9, multiply by 10 and subtract the number. For example, ${Math.max(num1, num2)} × 9 = ${Math.max(num1, num2)} × 10 - ${Math.max(num1, num2)} = ${Math.max(num1, num2) * 9}.`;
          } else if (num1 === 11 || num2 === 11) {
            tip = `When multiplying by 11, multiply by 10 and add the number. For example, ${Math.max(num1, num2)} × 11 = ${Math.max(num1, num2)} × 10 + ${Math.max(num1, num2)} = ${Math.max(num1, num2) * 11}.`;
          } else {
            tip = `Break this into smaller multiplications you know well, then add the results.`;
          }
          break;
        case '÷':
          tip = `For division, think about the multiplication fact: what number times ${num2} equals ${num1}?`;
          break;
        default:
          tip = `Break this calculation into smaller steps that you can solve mentally with ease.`;
      }
    } else {
      // Generic tips for more complex problems or unrecognized formats
      tip = `Break complex problems into simpler parts. Focus on one operation at a time, and use rounding to simplify calculations when possible.`;
    }
    
    // Return the tip in a format compatible with the expected API response
    return {
      statusCode: 200,
      body: JSON.stringify({
        generated_text: tip
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
    
  } catch (error) {
    console.error("Error in simple function:", error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error generating tip',
        message: error.message
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
}; 