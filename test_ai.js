require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');
const { extractTextFromPDF } = require('./services/pdfParser');
const geminiService = require('./services/gemini');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const doc = await Document.findOne();
        if (!doc) {
            console.log("No document found in DB!");
            process.exit(1);
        }
        console.log("Found document:", doc.filePath);

        const text = await extractTextFromPDF(doc.filePath);
        console.log("Extracted text length:", text?.length);
        if (!text) {
            console.log("Text is empty!");
        }

        console.log("Testing quiz generation...");
        const quiz = await geminiService.generateQuiz(text, 2);
        console.log("Quiz Generated Successfully! Questions count:", quiz.length);
        console.log("Sample question:", quiz[0]?.questionText);

    } catch (err) {
        console.error("Test Request Failed with Error:");
        console.error(err);
    }
    process.exit(0);
})();
