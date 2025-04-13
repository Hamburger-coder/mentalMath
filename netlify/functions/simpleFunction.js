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
    
    // Math tips object for different problem types
    const mathTips = {
      // Addition Tips
      "ADD_SINGLE_SINGLE": "Count up from the larger number. Ex: 3 + 5 -> Start at 5, count 3 more: 6, 7, 8.",
      "ADD_DOUBLE_SINGLE": "Break down the single digit to make a ten, then add the rest. Ex: 45 + 7 -> (45 + 5) + 2 = 50 + 2 = 52.",
      "ADD_DOUBLE_DOUBLE": "Add the tens place values, then add the ones place values. Ex: 23 + 58 -> (20+50) + (3+8) = 70 + 11 = 81.",
      "ADD_TRIPLE_DOUBLE": "Add place values vertically: ones, then tens, then hundreds. Ex: 123 + 45 -> (3+5=8), (20+40=60), (100+0=100) -> 100 + 60 + 8 = 168.",
      "ADD_GENERAL": "Break numbers into easier parts or round to the nearest ten/hundred and adjust.",

      // Subtraction Tips
      "SUB_SINGLE_SINGLE": "Count back from the first number, or think addition in reverse. Ex: 8 - 3 -> What number plus 3 equals 8? Answer: 5.",
      "SUB_DOUBLE_SINGLE": "Subtract enough to reach the nearest ten, then subtract the rest. Ex: 52 - 6 -> (52 - 2) - 4 = 50 - 4 = 46.",
      "SUB_DOUBLE_DOUBLE": "Subtract the tens place values, then subtract the ones place values. Ex: 78 - 34 -> (70-30) + (8-4) = 40 + 4 = 44. Or count up from the smaller number.",
      "SUB_TRIPLE_DOUBLE": "Subtract place values vertically: ones, tens, hundreds (borrow if needed). Ex: 245 - 67 -> (15-7=8 ones), (130-60=70 tens), (100-0=100 hundreds) -> 178.",
      "SUB_GENERAL": "Break numbers into easier parts, count up, or round and adjust.",

      // Multiplication Tips
      "MULT_SINGLE_SINGLE": "Memorize your multiplication tables! Practice helps. Or use repeated addition for small numbers: 4 * 3 = 4 + 4 + 4 = 12.",
      "MULT_BY_10": "Super easy! Just add a zero to the end of the other number. Ex: 7 * 10 = 70.",
      "MULT_DOUBLE_SINGLE": "Break down the double-digit number by place value. Ex: 15 * 3 -> (10 * 3) + (5 * 3) = 30 + 15 = 45.",
      "MULT_DOUBLE_DOUBLE": "Break down both numbers (FOIL/Box method). Ex: 12 * 14 -> (10*10)+(10*4)+(2*10)+(2*4) = 100+40+20+8 = 168.",
      "MULT_GENERAL": "Break down numbers into factors or use rounding strategies.",

      // Division Tips
      "DIV_BY_SINGLE": "Think multiplication in reverse. Ex: 45 / 5 -> Ask 'What number times 5 equals 45?'. Answer: 9. Knowing multiplication facts is key!",
      "DIV_BY_10": "Super easy! Just remove the last zero from the number being divided (the dividend). Ex: 80 / 10 = 8.",
      "DIV_BY_DOUBLE": "Think multiplication in reverse or estimate. Ex: 96 / 12 -> Ask 'What number times 12 equals 96?'. Answer: 8.",
      "DIV_GENERAL": "Look for factors, simplify the fraction, or use estimation.",

      // Fallback/Unknown
      "UNKNOWN": "Try breaking the problem down into smaller, simpler steps!"
    };
    
    // Function to classify the problem type
    function classifyProblem(problem) {
      // Split the problem into its components
      const parts = problem.split(/\s+/);
      
      // If not a standard binary operation format, return unknown
      if (parts.length !== 3) return "UNKNOWN";
      
      const num1 = parts[0];
      const operator = parts[1];
      const num2 = parts[2];
      
      // Get number of digits in each number
      const digits1 = num1.toString().replace(/[^\d]/g, '').length;
      const digits2 = num2.toString().replace(/[^\d]/g, '').length;
      
      // Check if number is a multiple of 10
      const isMultipleOf10 = (n) => /^[1-9]0+$/.test(n.toString());
      
      switch (operator) {
        case '+':
          if (digits1 === 1 && digits2 === 1) return "ADD_SINGLE_SINGLE";
          if (digits1 === 2 && digits2 === 1) return "ADD_DOUBLE_SINGLE";
          if (digits1 === 1 && digits2 === 2) return "ADD_DOUBLE_SINGLE"; // Commutative
          if (digits1 === 2 && digits2 === 2) return "ADD_DOUBLE_DOUBLE";
          if (digits1 === 3 && digits2 === 2) return "ADD_TRIPLE_DOUBLE";
          if (digits1 === 2 && digits2 === 3) return "ADD_TRIPLE_DOUBLE"; // Commutative
          return "ADD_GENERAL";
          
        case '-':
          if (digits1 === 1 && digits2 === 1) return "SUB_SINGLE_SINGLE";
          if (digits1 === 2 && digits2 === 1) return "SUB_DOUBLE_SINGLE";
          if (digits1 === 2 && digits2 === 2) return "SUB_DOUBLE_DOUBLE";
          if (digits1 === 3 && digits2 === 2) return "SUB_TRIPLE_DOUBLE";
          return "SUB_GENERAL";
          
        case '*':
        case '×':
          if (num2 === '10' || num1 === '10') return "MULT_BY_10";
          if (digits1 === 1 && digits2 === 1) return "MULT_SINGLE_SINGLE";
          if (digits1 === 2 && digits2 === 1) return "MULT_DOUBLE_SINGLE";
          if (digits1 === 1 && digits2 === 2) return "MULT_DOUBLE_SINGLE"; // Commutative
          if (digits1 === 2 && digits2 === 2) return "MULT_DOUBLE_DOUBLE";
          return "MULT_GENERAL";
          
        case '/':
        case '÷':
          if (num2 === '10') return "DIV_BY_10";
          if (digits2 === 1) return "DIV_BY_SINGLE";
          if (digits2 === 2) return "DIV_BY_DOUBLE";
          return "DIV_GENERAL";
          
        default:
          return "UNKNOWN";
      }
    }
    
    // Classify the problem
    const problemType = classifyProblem(mathProblem);
    console.log("Problem type classified as:", problemType);
    
    // Get the appropriate tip
    const tip = mathTips[problemType] || mathTips["UNKNOWN"];
    
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