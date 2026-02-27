require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

(async () => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log("Fetching models...");
        // the listModels function doesn't seem to be exposed on genAI normally, but wait, maybe it is or there's an API REST endpoint.
        // Let's just fetch it via fetch API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("Available Models:");
        data.models.forEach(m => console.log(m.name));
    } catch (err) {
        console.error(err);
    }
})();
