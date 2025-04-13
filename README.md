# Mental Math Trainer

A web application designed to help users sharpen their mental calculation skills through timed quizzes and progress tracking.

Accessible at: [https://silver-torrone-6eb2d2.netlify.app/](https://silver-torrone-6eb2d2.netlify.app/)

## Features

* **Quiz Sessions:** Practice with 10 math problems per session.
* **Progressive Difficulty:** Problems adapt based on your level, introducing subtraction, multiplication, and division as you advance.
* **Leveling System:** Earn XP for correct answers and level up to tackle more challenging calculations.
* **Performance Tracking:** View session summaries including accuracy, time taken, and correct answers.
* **Persistent Progress:** Your level and XP are saved in your browser for continued learning.
* **User Interface:** Features a clean dark mode interface.
* **Mobile Friendly:** Includes an on-screen keyboard for easy input on touch devices.
* **Feedback:** Provides immediate visual feedback on answers and tailored mental math tips.
* **AI-Powered Tips:** Generates personalized math tips based on your most challenging problems.

## Access

You can access and use the Mental Math Trainer directly in your web browser:
[https://silver-torrone-6eb2d2.netlify.app/](https://silver-torrone-6eb2d2.netlify.app/)

## Deployment with Netlify

This project includes Netlify serverless functions to securely communicate with the Hugging Face API for generating math tips.

### Prerequisites

- Netlify account
- Hugging Face API key

### Environment Variables

In the Netlify dashboard, set the following environment variable:

- `HUGGINGFACE_API_KEY`: Your Hugging Face API key for accessing the inference API

### Function Implementations

This project includes multiple implementations of the Netlify function to handle different environments:

1. **generateTip.js** - Uses the native fetch API (works in newer Netlify environments)
2. **generateTip-js/generateTip.js** - Alternative implementation with directory structure
3. **generateTipNode/generateTipNode.js** - Node.js implementation with node-fetch

The frontend attempts to call these functions in sequence, falling back to alternatives if one fails.

### Handling the "Could not resolve node-fetch" Error

If you encounter this error with Netlify Edge Functions:

```
⠙ Setting up the Edge Functions environment. This may take a couple of minutes.✘ [ERROR] Could not resolve "node-fetch"
```

Use one of these solutions:

1. Use the native implementation (generateTip.js) which doesn't require node-fetch
2. Use the generateTipNode implementation which uses dynamic imports for node-fetch
3. Configure your `netlify.toml` to use `node_bundler = "nft"` for better compatibility

### Deployment Steps

1. Push your code to a GitHub repository
2. Connect the repository to Netlify
3. In the build settings, ensure:
   - Build command: (leave blank or use `npm run build` if you add a build step later)
   - Publish directory: `.`
4. Add your environment variables in the Netlify dashboard
5. Deploy!

### Local Development

1. Install the Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Create a `.env` file with your Hugging Face API key:
   ```
   HUGGINGFACE_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```
   netlify dev
   ```

This will start a local server with your site and serverless functions.
