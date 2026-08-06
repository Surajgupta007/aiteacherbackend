const Groq = require('groq-sdk');

// Function to get the Groq client
const getClient = () => {
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const MODEL = 'llama-3.3-70b-versatile';

exports.generateSummary = async (text) => {
    const client = getClient();
    const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'user',
                content: `Summarize the following document content in concise bullet points. Provide only the summary:\n\n${text}`
            }
        ],
    });
    return completion.choices[0].message.content;
};

exports.explainConcept = async (concept, context = '') => {
    const client = getClient();
    const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'user',
                content: `Explain the following concept "${concept}" simply but thoroughly. Include examples and key points.\nContext (if any): ${context}`
            }
        ],
    });
    return completion.choices[0].message.content;
};

exports.generateFlashcards = async (text, num = 5) => {
    const client = getClient();
    const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'user',
                content: `Generate exactly ${num} flashcards based on the following text. 
Return ONLY a valid JSON array of objects, with each object having "question" and "answer" properties. 
Ensure the output is pure JSON without markdown code blocks, beginning with [ and ending with ].

Text: ${text}`
            }
        ],
    });

    const responseText = completion.choices[0].message.content;
    try {
        const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        return JSON.parse(cleanedJson);
    } catch (err) {
        console.error('Failed to parse flashcards JSON', err);
        throw new Error('AI failed to generate valid flashcard data.');
    }
};

exports.generateQuiz = async (text, num = 5, difficulty = 'medium') => {
    const client = getClient();
    const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'user',
                content: `Generate a ${num}-question multiple choice quiz based on the following text. The difficulty should be ${difficulty}.
Return ONLY a valid JSON array of objects. Each object must have:
"questionText" (string)
"options" (array of exactly 4 strings)
"correctAnswer" (string, must exactly match one of the options)
"explanation" (string)

Ensure the output is pure JSON without markdown code blocks, beginning with [ and ending with ].

Text: ${text}`
            }
        ],
    });

    const responseText = completion.choices[0].message.content;
    try {
        const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        return JSON.parse(cleanedJson);
    } catch (err) {
        console.error('Failed to parse quiz JSON', err);
        throw new Error('AI failed to generate valid quiz data.');
    }
};

exports.chatWithDocument = async (history, question, documentContext) => {
    const client = getClient();

    // Convert history to Groq message format
    const messages = [
        {
            role: 'system',
            content: `You are a helpful study assistant. Answer questions based on the following document context.
If the answer is not in the context, use your general knowledge but mention that it's not explicitly in the document.

Document Context:
${documentContext.substring(0, 30000)}`
        },
        ...(history || []).map(h => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.parts?.[0]?.text || h.content || ''
        })),
        {
            role: 'user',
            content: question
        }
    ];

    const completion = await client.chat.completions.create({
        model: MODEL,
        messages,
    });

    return completion.choices[0].message.content;
};

exports.generateRevisionPlan = async (text, analytics, duration) => {
    const client = getClient();
    const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'user',
                content: `You are an intelligent exam preparation assistant.

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
}`
            }
        ],
    });

    const responseText = completion.choices[0].message.content;
    try {
        const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        return JSON.parse(cleanedJson);
    } catch (err) {
        console.error('Failed to parse revision JSON', err);
        throw new Error('AI failed to generate valid revision plan data.');
    }
};
