const { GoogleGenerativeAI } = require('@google/generative-ai');

// Function to get the Gemini Model
const getModel = () => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

exports.generateSummary = async (text) => {
    const model = getModel();
    const prompt = `Summarize the following document content in concise bullet points. Provide only the summary:\n\n${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
};

exports.explainConcept = async (concept, context = "") => {
    const model = getModel();
    const prompt = `Explain the following concept "${concept}" simply but thoroughly. Include examples and key points.\nContext (if any): ${context}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
};

exports.generateFlashcards = async (text, num = 5) => {
    const model = getModel();
    const prompt = `Generate exactly ${num} flashcards based on the following text. 
Return ONLY a valid JSON array of objects, with each object having "question" and "answer" properties. 
Ensure the output is pure JSON without markdown code blocks, beginning with [ and ending with ].

Text: ${text}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
        // Sanitize response to ensure it parses correctly if model includes markdown
        const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        return JSON.parse(cleanedJson);
    } catch (err) {
        console.error("Failed to parse flashcards JSON", err);
        throw new Error("AI failed to generate valid flashcard data.");
    }
};

exports.generateQuiz = async (text, num = 5, difficulty = "medium") => {
    const model = getModel();
    const prompt = `Generate a ${num}-question multiple choice quiz based on the following text. The difficulty should be ${difficulty}.
Return ONLY a valid JSON array of objects. Each object must have:
"questionText" (string)
"options" (array of exactly 4 strings)
"correctAnswer" (string, must exactly match one of the options)
"explanation" (string)

Ensure the output is pure JSON without markdown code blocks, beginning with [ and ending with ].

Text: ${text}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
        const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        return JSON.parse(cleanedJson);
    } catch (err) {
        console.error("Failed to parse quiz JSON", err);
        throw new Error("AI failed to generate valid quiz data.");
    }
};

exports.chatWithDocument = async (history, question, documentContext) => {
    const model = getModel();
    const chat = model.startChat({
        history: history || [],
    });
    const prompt = `Using the following document context, please answer the user's question.
If the answer is not in the context, use your general knowledge but mention that it's not explicitly in the document.

Document Context:
${documentContext.substring(0, 30000)} // limiting context to avoid token overflow

Question: ${question}`;

    const result = await chat.sendMessage(prompt);
    return result.response.text();
};

exports.generateRevisionPlan = async (text, analytics, duration) => {
    const model = getModel();
    const prompt = `You are an intelligent exam preparation assistant.

Analyze the following:

DOCUMENT CONTENT:
${text}

QUIZ ANALYTICS:
* Accuracy per topic: ${analytics.accuracy}% general accuracy based on ${analytics.totalQuizzesTaken} past quizzes
* Total Flashcards studying this doc: ${analytics.totalFlashcards}

Your task:
Generate a structured ${duration}-minute crash revision plan optimized for exam performance.

Structure your response exactly in this format as a valid JSON object. Do not wrap in markdown tags like \`\`\`json. Return ONLY raw JSON starting with { and ending with }.

{
  "topConcepts": [
    "Priority concept 1",
    "Priority concept 2"
  ],
  "commonMistakes": [
    { "mistake": "Mistake name", "why": "Why it happens", "tip": "How to fix" }
  ],
  "timeline": [
    { "time": "0-5 mins", "action": "What to revise", "method": "How to revise", "focus": "High" },
    { "time": "5-15 mins", "action": "...", "method": "...", "focus": "..." }
  ],
  "flashcards": [
    { "question": "Q1", "answer": "A1" }
  ],
  "tips": [
    "Tip 1",
    "Tip 2"
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
        const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        return JSON.parse(cleanedJson);
    } catch (err) {
        console.error("Failed to parse revision JSON", err);
        throw new Error("AI failed to generate valid revision plan data.");
    }
};
