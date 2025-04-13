 // --- DOM Elements ---
 const app = document.getElementById('app');
 const startScreen = document.getElementById('start-screen');
 const quizScreen = document.getElementById('quiz-screen');
 const summaryScreen = document.getElementById('summary-screen');

 const startQuizBtn = document.getElementById('start-quiz-btn');
 const problemCounterEl = document.getElementById('problem-counter');
 const scoreCounterEl = document.getElementById('score-counter');
 const timerEl = document.getElementById('timer');
 const problemEl = document.getElementById('problem');
 const answerInput = document.getElementById('answer-input');
 const keyboard = document.getElementById('keyboard');

 const summaryAttemptedEl = document.getElementById('summary-attempted');
 const summaryCorrectEl = document.getElementById('summary-correct');
 const summaryAccuracyEl = document.getElementById('summary-accuracy');
 const summaryTimeEl = document.getElementById('summary-time');
 const summaryLevelEl = document.getElementById('summary-level');
 const summaryXpEl = document.getElementById('summary-xp');
 const summaryXpNextEl = document.getElementById('summary-xp-next');
 const progressBarContainer = document.getElementById('progress-bar-container');
 const progressBar = document.getElementById('progress-bar');
 const mentalTipEl = document.getElementById('mental-tip');
 const startNextSessionBtn = document.getElementById('start-next-session-btn');

 // --- Constants ---
 const PROBLEMS_PER_SESSION = 10;
 const XP_PER_LEVEL_BASE = 100; // Base XP needed for level 1 -> 2
 const XP_GROWTH_FACTOR = 1.1; // XP needed increases by 10% each level
 const XP_PER_CORRECT_ANSWER = 10;
 const BASE_DIFFICULTY_ADD_SUB = 5; // Starting range for +/-
 const BASE_DIFFICULTY_MULT_DIV = 2; // Starting range for */÷ factors
 const LEVEL_DIFFICULTY_INCREMENT = 3; // How much range increases per level


 // --- Game State Variables ---
 let userData = {
     level: 1,
     xp: 0,
     sessionHistory: []
 };

 let currentSession = {
     problems: [],
     startTime: null,
     endTime: null,
     correctAnswers: 0,
     problemsAttempted: 0,
     currentProblemIndex: 0,
     score: 0, // This score is the XP gained *in this session*
     timerInterval: null,
     elapsedSeconds: 0,
     currentProblem: null,
     problemStartTime: null,
     // Session analysis
     keystrokes: [], // Array to track keystroke timestamps
     lastKeystrokeTime: null, // Last keystroke time for interval calculation
     struggleScores: [], // Array to track struggle scores for each problem
     mostDifficultProblem: null // Problem with highest struggle score
 };

 let isMobile = false;
 let feedbackTimeout = null; // To manage feedback display timing

 // --- Initialization ---
 document.addEventListener('DOMContentLoaded', init);

 function init() {
     console.log("Initializing Mental Math Trainer (Dark Mode)...");
     loadUserData();
     detectDevice();
     setupEventListeners();
     showScreen('start');
     updateLevelDisplay(); // Initial display update for summary screen elements
 }

 function getXpForNextLevel(level) {
      // XP needed increases with level
     return Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_GROWTH_FACTOR, level - 1));
 }

 function loadUserData() {
     const savedData = localStorage.getItem('mentalMathUserData_v2'); // Use a new key if structure changes significantly
     if (savedData) {
         try {
             userData = JSON.parse(savedData);
             // Validation
             if (typeof userData.level !== 'number' || userData.level < 1) userData.level = 1;
             if (typeof userData.xp !== 'number' || userData.xp < 0) userData.xp = 0;
             if (!Array.isArray(userData.sessionHistory)) userData.sessionHistory = [];
             console.log("User data loaded:", userData);
         } catch (error) {
             console.error("Error parsing user data from localStorage:", error);
             userData = { level: 1, xp: 0, sessionHistory: [] };
             saveUserData();
         }
     } else {
         console.log("No previous user data found. Using defaults.");
         saveUserData();
     }
 }

 function saveUserData() {
     try {
         localStorage.setItem('mentalMathUserData_v2', JSON.stringify(userData));
         console.log("User data saved:", userData);
     } catch (error) {
         console.error("Error saving user data to localStorage:", error);
     }
 }

 function detectDevice() {
     isMobile = ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0) || window.innerWidth <= 768;
     console.log("Is mobile device:", isMobile);
     // Visibility handled when quiz screen shown
 }

 function toggleKeyboardVisibility() {
      if (isMobile) {
         keyboard.classList.remove('hidden');
         // answerInput.readOnly = true; // Optionally prevent native keyboard
     } else {
         keyboard.classList.add('hidden');
         // answerInput.readOnly = false;
     }
 }

 function setupEventListeners() {
     startQuizBtn.addEventListener('click', startQuiz);
     startNextSessionBtn.addEventListener('click', startQuiz);
     answerInput.addEventListener('keypress', handleAnswerInputKeypress);
     answerInput.addEventListener('input', function(e) {
         // Only check on input events that aren't from keyboard keypresses (handled separately)
         // This helps with paste events or other input methods
         const value = e.target.value.trim();
         if (value !== '' && !isNaN(parseInt(value))) {
             const userAnswer = parseInt(value);
             if (currentSession.currentProblem && userAnswer === currentSession.currentProblem.answer) {
                 checkAnswer();
             }
         }
     });
     keyboard.addEventListener('click', handleKeyboardClick);
 }

 // --- Screen Management ---
 function showScreen(screenName) {
     startScreen.classList.add('hidden');
     quizScreen.classList.add('hidden');
     summaryScreen.classList.add('hidden');

     if (screenName === 'start') {
         startScreen.classList.remove('hidden');
     } else if (screenName === 'quiz') {
         quizScreen.classList.remove('hidden');
         detectDevice(); // Re-check device type
         toggleKeyboardVisibility();
         answerInput.value = ''; // Ensure input is empty
         answerInput.focus();
         // Clear any lingering feedback styles
         answerInput.classList.remove('correct-answer', 'incorrect-answer');
     } else if (screenName === 'summary') {
         summaryScreen.classList.remove('hidden');
     }
 }

 // --- Quiz Logic ---
 function startQuiz() {
     console.log("Starting new quiz session...");
     resetSessionState();
     currentSession.startTime = Date.now();
     startTimer();
     nextProblem(); // Load the first problem
     showScreen('quiz');
     // updateQuizDisplay() is called within nextProblem()
 }

 function resetSessionState() {
      // Clear previous feedback timeout if any
      if(feedbackTimeout) clearTimeout(feedbackTimeout);

     currentSession = {
         problems: [],
         startTime: null,
         endTime: null,
         correctAnswers: 0,
         problemsAttempted: 0,
         currentProblemIndex: 0,
         score: 0, // Reset session score (XP gained this session)
         timerInterval: null,
         elapsedSeconds: 0,
         currentProblem: null,
         problemStartTime: null,
         // Session analysis
         keystrokes: [], // Array to track keystroke timestamps
         lastKeystrokeTime: null, // Last keystroke time for interval calculation
         struggleScores: [], // Array to track struggle scores for each problem
         mostDifficultProblem: null // Problem with highest struggle score
     };
     timerEl.textContent = "Time: 0s"; // Reset timer display
      scoreCounterEl.textContent = "Score: 0"; // Reset score display
      problemCounterEl.textContent = `Problem: 0 / ${PROBLEMS_PER_SESSION}`; // Reset problem counter display
 }

 function startTimer() {
     if (currentSession.timerInterval) clearInterval(currentSession.timerInterval);
     currentSession.elapsedSeconds = 0;
     timerEl.textContent = `Time: 0s`; // Update display immediately
     currentSession.timerInterval = setInterval(() => {
         currentSession.elapsedSeconds++;
         timerEl.textContent = `Time: ${currentSession.elapsedSeconds}s`;
     }, 1000);
 }

 function stopTimer() {
     clearInterval(currentSession.timerInterval);
     currentSession.timerInterval = null;
 }

 function nextProblem() {
     // Clear previous feedback style and timeout
     answerInput.classList.remove('correct-answer', 'incorrect-answer');
      if(feedbackTimeout) clearTimeout(feedbackTimeout);

     if (currentSession.currentProblemIndex >= PROBLEMS_PER_SESSION) {
         endQuiz();
         return;
     }

     currentSession.currentProblemIndex++;
     currentSession.currentProblem = generateProblem(userData.level);
     currentSession.problemStartTime = Date.now();

     updateQuizDisplay(); // Update counters
     problemEl.textContent = currentSession.currentProblem.question;
     answerInput.value = '';
     answerInput.disabled = false; // Ensure input is enabled
     answerInput.focus();
 }

 // --- UPDATED Difficulty Scaling ---
 function generateProblem(level) {
     const maxAddSub = BASE_DIFFICULTY_ADD_SUB + (level * LEVEL_DIFFICULTY_INCREMENT);
     const maxMultFactor = BASE_DIFFICULTY_MULT_DIV + Math.floor(level / 1.5); // Slower growth for mult/div factors
     const maxDivResult = BASE_DIFFICULTY_MULT_DIV + Math.floor(level / 2); // Max result for division

     let num1, num2, operator, question, answer;

     // Determine available operations based on level
     const availableOps = ['+'];
     if (level >= 2) availableOps.push('-');
     if (level >= 4) availableOps.push('×'); // Multiplication earlier
     if (level >= 6) availableOps.push('÷'); // Division later

      // Introduce negative results in subtraction more gradually
     const allowNegativeSubtraction = level >= 5;

     // Choose a random available operator
     operator = availableOps[Math.floor(Math.random() * availableOps.length)];

     switch (operator) {
         case '-':
             num1 = Math.floor(Math.random() * maxAddSub);
             if (allowNegativeSubtraction && Math.random() > 0.4) { // 60% chance of negative result if allowed
                 num2 = num1 + Math.floor(Math.random() * (maxAddSub / 2)) + 1; // Ensure num2 is larger
             } else {
                 num2 = Math.floor(Math.random() * (num1 + 1)); // Ensure result >= 0 if negatives not allowed or by chance
             }
             answer = num1 - num2;
             break;
         case '×':
             num1 = Math.floor(Math.random() * maxMultFactor) + 1; // Avoid multiplying by 0 often
             num2 = Math.floor(Math.random() * maxMultFactor) + (num1 === 1 ? 1 : 0); // Avoid 1x0 if num1 is 1
             answer = num1 * num2;
             break;
          case '÷':
             // Ensure non-zero divisor and integer result
             num2 = Math.floor(Math.random() * maxMultFactor) + 1; // Divisor > 0
             answer = Math.floor(Math.random() * maxDivResult) + 1; // Result > 0
             num1 = answer * num2;
             break;
         case '+':
         default:
             num1 = Math.floor(Math.random() * maxAddSub);
             num2 = Math.floor(Math.random() * maxAddSub);
             answer = num1 + num2;
             break;
     }

     question = `${num1} ${operator} ${num2}`;
     console.log(`Generated Problem (Level ${level}): ${question} = ${answer}, Operator: ${operator}`);
     return { question, answer };
 }


 function updateQuizDisplay() {
     problemCounterEl.textContent = `Problem: ${currentSession.currentProblemIndex} / ${PROBLEMS_PER_SESSION}`;
     // SCORE UPDATE: Display the score accumulated *in this session*
     scoreCounterEl.textContent = `Score: ${currentSession.score}`;
 }

 function handleAnswerInputKeypress(event) {
     const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', 'Enter', 'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
     
     // Track keystroke timestamps for session analysis (for valid input keys)
     if (allowedKeys.includes(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
         trackKeystroke(event.key);
     }
     
     if (event.key === 'Enter') {
          event.preventDefault();
          checkAnswer();
      } else if (allowedKeys.includes(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
          // For number keys, check if adding this digit would make a correct answer
          setTimeout(() => {
              const currentValue = answerInput.value.trim();
              if (currentValue !== '' && !isNaN(parseInt(currentValue))) {
                  const userAnswer = parseInt(currentValue);
                  // If the answer is correct, automatically process it
                  if (currentSession.currentProblem && userAnswer === currentSession.currentProblem.answer) {
                      checkAnswer();
                  }
              }
          }, 10); // Small timeout to ensure value is updated
      } else if (!allowedKeys.includes(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
          // Prevent most non-numeric/control keys on physical keyboard
          // event.preventDefault(); // Can be too strict, rely on validation
     }
 }

  function handleKeyboardClick(event) {
     if (event.target.tagName !== 'BUTTON') return;

     const key = event.target.dataset.key;
     const currentValue = answerInput.value;

     // Track on-screen keyboard input for session analysis
     trackKeystroke(key);

     // Clear feedback styling on new input
      answerInput.classList.remove('correct-answer', 'incorrect-answer');
      if(feedbackTimeout) clearTimeout(feedbackTimeout);

     if (key === 'Enter') {
         checkAnswer();
     } else if (key === 'Backspace') {
         answerInput.value = currentValue.slice(0, -1);
     } else if (key === '-' && currentValue.length === 0) {
         answerInput.value += key;
     } else if (!isNaN(parseInt(key))) {
         answerInput.value += key;
         
         // Check if the current input is correct after adding a digit
         const newValue = answerInput.value.trim();
         if (newValue !== '' && !isNaN(parseInt(newValue))) {
             const userAnswer = parseInt(newValue);
             // If the answer is correct, automatically process it
             if (currentSession.currentProblem && userAnswer === currentSession.currentProblem.answer) {
                 checkAnswer();
             }
         }
     }
     answerInput.focus();
 }

 /**
  * Tracks keystroke timing and intervals for analyzing user input patterns
  * @param {string} key - The key that was pressed
  */
 function trackKeystroke(key) {
     const now = Date.now();
     
     // Calculate interval since last keystroke (if any)
     let interval = 0;
     if (currentSession.lastKeystrokeTime !== null) {
         interval = now - currentSession.lastKeystrokeTime;
     }
     
     // Store keystroke data
     currentSession.keystrokes.push({
         key: key,
         timestamp: now,
         interval: interval,
         problemIndex: currentSession.currentProblemIndex
     });
     
     // Update last keystroke time
     currentSession.lastKeystrokeTime = now;
 }

 /**
  * Calculates struggle score for the current problem based on time taken and keystroke patterns
  * Higher score = more difficulty with the problem
  */
 function calculateStruggleScore() {
     // Get keystrokes for current problem
     const problemKeystrokes = currentSession.keystrokes.filter(
         k => k.problemIndex === currentSession.currentProblemIndex
     );
     
     // Calculate total time taken (from problem start to now)
     const timeTaken = (Date.now() - currentSession.problemStartTime) / 1000;
     
     // Calculate hesitation penalty based on keystroke intervals
     // We define a "hesitation" as a pause longer than 1.5 seconds between keystrokes
     const HESITATION_THRESHOLD = 1500; // milliseconds
     const HESITATION_WEIGHT = 1.5; // Weight multiplier for hesitations
     
     let hesitationPenalty = 0;
     for (const keystroke of problemKeystrokes) {
         if (keystroke.interval > HESITATION_THRESHOLD) {
             // Add weighted penalty for long pauses (hesitations)
             hesitationPenalty += (keystroke.interval / 1000) * HESITATION_WEIGHT;
         }
     }
     
     // Final struggle score combines time and hesitation penalties
     const struggleScore = timeTaken + hesitationPenalty;
     
     return {
         timeTaken: timeTaken,
         hesitationPenalty: hesitationPenalty,
         totalScore: struggleScore
     };
 }

 function checkAnswer() {
     // Prevent checking if already processing feedback
      if (answerInput.disabled) return;

     const userAnswerRaw = answerInput.value.trim();
     if (userAnswerRaw === '' || isNaN(parseInt(userAnswerRaw)) || !/^-?\d+$/.test(userAnswerRaw)) {
         // More robust check for valid integer format
         answerInput.classList.add('incorrect-answer'); // Use visual feedback for invalid input
          console.log("Invalid input provided:", userAnswerRaw);
          feedbackTimeout = setTimeout(() => {
              answerInput.classList.remove('incorrect-answer');
          }, 800); // Remove feedback after a delay
         return;
     }

      // Disable input during feedback
     answerInput.disabled = true;

     const userAnswer = parseInt(userAnswerRaw);
     const correctAnswer = currentSession.currentProblem.answer;
     const timeTaken = (Date.now() - currentSession.problemStartTime) / 1000;

     const isCorrect = userAnswer === correctAnswer;

     // Calculate struggle score for this problem
     const struggleData = calculateStruggleScore();
     
     // Store struggle score for this problem
     currentSession.struggleScores.push({
         problemIndex: currentSession.currentProblemIndex,
         question: currentSession.currentProblem.question,
         struggleScore: struggleData.totalScore,
         timeTaken: struggleData.timeTaken,
         hesitationPenalty: struggleData.hesitationPenalty
     });
     
     console.log(`Problem: ${currentSession.currentProblem.question}, User: ${userAnswer}, Correct: ${correctAnswer}, Correct: ${isCorrect}, Time: ${timeTaken.toFixed(2)}s, Struggle Score: ${struggleData.totalScore.toFixed(2)}`);

     // Visual Feedback using CSS classes
     answerInput.classList.add(isCorrect ? 'correct-answer' : 'incorrect-answer');

     if (isCorrect) {
         currentSession.correctAnswers++;
         // SCORE FIX: Increment session score correctly
         currentSession.score += XP_PER_CORRECT_ANSWER;
         updateQuizDisplay(); // Update score display immediately on correct answer
     }

     currentSession.problemsAttempted++;

     currentSession.problems.push({
         question: currentSession.currentProblem.question,
         correctAnswer: correctAnswer,
         userAnswer: userAnswer,
         timeTaken: timeTaken,
         isCorrect: isCorrect,
         struggleScore: struggleData.totalScore
     });

     // Reset keystroke tracking for next problem
     currentSession.lastKeystrokeTime = null;

     // Move to the next problem after a delay
     // Use shorter delay for correct answers to be responsive
     const feedbackDelay = isCorrect ? 350 : 600;
     // Clear the feedback styling before moving on
     feedbackTimeout = setTimeout(() => {
          answerInput.classList.remove('correct-answer', 'incorrect-answer');
          answerInput.disabled = false; // Re-enable input
          nextProblem();
      }, feedbackDelay);
 }

 function endQuiz() {
     console.log("Ending quiz session...");
      if(feedbackTimeout) clearTimeout(feedbackTimeout); // Clear any pending feedback timeout
     stopTimer();
     currentSession.endTime = Date.now();
     const totalTime = (currentSession.endTime - currentSession.startTime) / 1000;

     // Identify the most difficult problem (highest struggle score)
     identifyMostDifficultProblem();
     
     // Generate personalized tip based on the most difficult problem
     if (currentSession.mostDifficultProblem) {
         generatePersonalizedTip(currentSession.mostDifficultProblem);
     }

     updateUserDataAfterSession(); // Update level/XP based on session score
     saveUserData();
     displaySummary(totalTime);
     showScreen('summary');
 }

 /**
  * Identifies the problem with the highest struggle score in the session
  */
 function identifyMostDifficultProblem() {
     if (currentSession.struggleScores.length === 0) return;
     
     // Find the problem with the highest struggle score
     let maxScore = -1;
     let maxScoreProblem = null;
     
     for (const problem of currentSession.struggleScores) {
         if (problem.struggleScore > maxScore) {
             maxScore = problem.struggleScore;
             maxScoreProblem = problem;
         }
     }
     
     currentSession.mostDifficultProblem = maxScoreProblem;
     console.log("Most difficult problem identified:", currentSession.mostDifficultProblem);
 }

 /**
  * Makes an API call to our Netlify Function which securely communicates with Hugging Face
  * to generate a personalized tip based on the most difficult problem from the session
  * @param {Object} problem - The problem object with the highest struggle score
  */
 async function generatePersonalizedTip(problem) {
     const mentalTipEl = document.getElementById('mental-tip');
     mentalTipEl.textContent = 'Generating a personalized tip...';
     
     // Extract the question from the problem object
     const mathProblem = problem.question;
     console.log("Attempting to generate personalized tip for:", mathProblem);
     
     async function callNetlifyFunction(functionPath, problem) {
         console.log(`Attempting to call function at: ${functionPath}`);
         try {
             const response = await fetch(functionPath, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({ problem: problem }),
             });
             
             console.log(`Response status from ${functionPath}:`, response.status);
             
             if (!response.ok) {
                 const errorText = await response.text();
                 console.error(`API request failed with status ${response.status}:`, errorText);
                 throw new Error(`Request failed with status ${response.status}`);
             }
             
             const data = await response.json();
             console.log(`Successful response from ${functionPath}:`, data);
             return data;
         } catch (error) {
             console.error(`Error calling ${functionPath}:`, error);
             throw error;
         }
     }
     
     try {
         // Try the simple function first (no external API dependencies)
         try {
             console.log("Trying the simple function first");
             const data = await callNetlifyFunction('/.netlify/functions/simpleFunction', mathProblem);
             
             if (data && data.generated_text) {
                 console.log("Successfully generated tip with simple function");
                 mentalTipEl.textContent = data.generated_text;
                 return;
             }
         } catch (simpleError) {
             console.log("Simple function failed, trying other functions...", simpleError);
         }
         
         // Try each function path in sequence
         const functionPaths = [
             '/.netlify/functions/generateTip',
             '/.netlify/functions/generateTip-js/generateTip',
             '/.netlify/functions/generateTipNode/generateTipNode'
         ];
         
         let lastError = null;
         
         for (const path of functionPaths) {
             try {
                 const data = await callNetlifyFunction(path, mathProblem);
                 
                 if (data && data.generated_text) {
                     console.log(`Successfully generated tip with ${path}`);
                     mentalTipEl.textContent = data.generated_text;
                     return;
                 } else {
                     console.warn(`Unexpected response format from ${path}:`, data);
                 }
             } catch (error) {
                 console.log(`Function ${path} failed:`, error);
                 lastError = error;
                 // Continue to the next function path
             }
         }
         
         // If we get here, all attempts failed
         console.error("All attempts to generate tip failed:", lastError);
         mentalTipEl.textContent = "Could not generate a tip. Try a different math problem.";
         
     } catch (error) {
         console.error("Error generating personalized tip:", error);
         mentalTipEl.textContent = "Could not generate a tip. Try a different math problem.";
     }
 }

 // --- User Data & Leveling ---
 function updateUserDataAfterSession() {
     // Update total XP with the score (XP gained) from the current session
     const xpGained = currentSession.score; // Score directly maps to XP gained
     userData.xp += xpGained;

     let xpForNext = getXpForNextLevel(userData.level);

     // Check for level up (can happen multiple times)
     while (userData.xp >= xpForNext) {
         userData.level++;
         userData.xp -= xpForNext; // Subtract threshold for the level just passed
         xpForNext = getXpForNextLevel(userData.level); // Get threshold for the *new* level
         console.log(`Level Up! Reached Level ${userData.level}. XP needed for next: ${xpForNext}`);
     }

     // Add session summary to history
     const sessionSummary = {
         date: new Date().toISOString(),
         levelReached: userData.level, // Level at end of session
         correct: currentSession.correctAnswers,
         attempted: currentSession.problemsAttempted,
         time: (currentSession.endTime - currentSession.startTime) / 1000,
         accuracy: currentSession.problemsAttempted > 0 ? (currentSession.correctAnswers / currentSession.problemsAttempted) * 100 : 0,
         xpGained: xpGained
     };
     userData.sessionHistory.push(sessionSummary);
     if (userData.sessionHistory.length > 50) { // Limit history
         userData.sessionHistory.shift();
     }
      console.log("Session finished. User XP:", userData.xp, "Level:", userData.level);
 }

 function updateLevelDisplay() {
      const xpForNext = getXpForNextLevel(userData.level);
     summaryLevelEl.textContent = userData.level;
     summaryXpEl.textContent = userData.xp;
     summaryXpNextEl.textContent = xpForNext; // Display XP needed for the *current* level

     const progressPercent = xpForNext > 0 ? (userData.xp / xpForNext) * 100 : 100; // Handle potential division by zero if xpForNext is 0 (unlikely)
     // Cap progress bar at 100% visually, even if XP exceeds threshold before level up logic runs
     const displayPercent = Math.min(progressPercent, 100);

     progressBar.style.width = `${displayPercent}%`;
     progressBar.textContent = `${Math.floor(displayPercent)}%`;
 }


 // --- Summary Screen ---
 function displaySummary(totalTime) {
     const accuracy = currentSession.problemsAttempted > 0
         ? (currentSession.correctAnswers / currentSession.problemsAttempted) * 100
         : 0;

     summaryAttemptedEl.textContent = currentSession.problemsAttempted;
     summaryCorrectEl.textContent = currentSession.correctAnswers;
     summaryAccuracyEl.textContent = `${accuracy.toFixed(1)}%`;
     summaryTimeEl.textContent = `${totalTime.toFixed(1)}s`;

     updateLevelDisplay(); // Update level and XP progress bar based on latest userData
     
     // Display information about the most difficult problem
     const difficultProblemEl = document.getElementById('difficult-problem');
     const difficultTimeEl = document.getElementById('difficult-time');
     const struggleScoreEl = document.getElementById('struggle-score');
     
     if (currentSession.mostDifficultProblem) {
         difficultProblemEl.textContent = currentSession.mostDifficultProblem.question;
         difficultTimeEl.textContent = `${currentSession.mostDifficultProblem.timeTaken.toFixed(1)}s`;
         struggleScoreEl.textContent = currentSession.mostDifficultProblem.struggleScore.toFixed(1);
     } else {
         difficultProblemEl.textContent = "None identified";
         difficultTimeEl.textContent = "0s";
         struggleScoreEl.textContent = "0";
     }

     // Note: The mental tip is now updated in the generatePersonalizedTip function
     // If no difficult problem was identified or API call failed, use a generic tip
     if (!currentSession.mostDifficultProblem) {
         mentalTipEl.textContent = selectMentalMathTip(accuracy, userData.level);
     }
 }

 function selectMentalMathTip(accuracy, level) {
     // Enhanced tips based on performance and level
     if (accuracy < 60) {
         return "Tip: Accuracy is key! Slow down slightly, double-check your calculations, especially for subtraction and carrying over in addition.";
     } else if (accuracy < 85) {
          if (level <= 3) {
              return "Tip: Solid effort! Practice breaking numbers into easier parts (e.g., 47 + 8 = 47 + 3 + 5 = 50 + 5 = 55).";
          } else if (level <= 6) {
               return "Tip: Good work! Focus on multiplication tables. Knowing them instantly frees up mental energy for harder problems.";
          } else {
              return "Tip: Getting there! Try visualizing the steps for division or multi-step problems if they appear.";
          }
     } else if (accuracy < 95) {
          if (level <= 5) {
              return "Tip: Very good! Look for shortcuts like adding/subtracting 9 or 11 (adjust by 10, then +/- 1).";
          } else {
             return "Tip: Excellent accuracy! Challenge yourself by trying to answer a little faster without sacrificing correctness.";
          }
     } else { // Accuracy >= 95%
          if (level <= 7) {
              return "Tip: Fantastic accuracy! Keep practicing consistently to make these calculations second nature.";
          } else {
              return "Tip: Master level! You're doing great. Can you estimate answers quickly before calculating precisely?";
          }

     }
 }
