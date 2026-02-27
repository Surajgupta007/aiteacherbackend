const Document = require('../models/Document');
const Flashcard = require('../models/Flashcard');
const Quiz = require('../models/Quiz');
const { extractTextFromPDF } = require('../services/pdfParser');
const geminiService = require('../services/gemini');

// Helper to get text from a Document ID
const getDocumentText = async (docId, userId) => {
    console.log(`Getting text for document ${docId} user ${userId}`);
    const document = await Document.findById(docId);
    if (!document) throw new Error('Document not found');
    if (document.user.toString() !== userId) throw new Error('Not authorized');

    console.log(`Document found. Path: ${document.filePath}`);
    const text = await extractTextFromPDF(document.filePath);
    console.log(`Extracted text length: ${text.length}`);
    return text;
};

// @desc      Generate document summary
// @route     POST /api/v1/ai/summary
// @access    Private
exports.generateSummary = async (req, res) => {
    try {
        const { documentId } = req.body;
        const text = await getDocumentText(documentId, req.user.id);
        const summary = await geminiService.generateSummary(text);

        // Update document with summary
        const document = await Document.findByIdAndUpdate(documentId, { summary }, { new: true });

        res.status(200).json({ success: true, data: document });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Explain a concept
// @route     POST /api/v1/ai/explain
// @access    Private
exports.explainConcept = async (req, res) => {
    try {
        const { concept, documentId } = req.body;
        let context = "";
        if (documentId) {
            context = await getDocumentText(documentId, req.user.id);
            context = context.substring(0, 15000); // Send partial context due to limits
        }

        const explanation = await geminiService.explainConcept(concept, context);
        res.status(200).json({ success: true, data: explanation });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Generate flashcards
// @route     POST /api/v1/ai/flashcards
// @access    Private
exports.generateFlashcards = async (req, res) => {
    try {
        const { documentId, numCards } = req.body;
        const text = await getDocumentText(documentId, req.user.id);
        const textSample = text.substring(0, 40000); // Gemini limit safe context

        const generatedCards = await geminiService.generateFlashcards(textSample, numCards || 10);

        // Save cards to DB
        const flashcardsToInsert = generatedCards.map(card => ({
            user: req.user.id,
            document: documentId,
            question: card.question || card.questionText,
            answer: card.answer
        }));

        await Flashcard.insertMany(flashcardsToInsert);

        res.status(200).json({ success: true, message: `${flashcardsToInsert.length} flashcards generated` });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Generate quiz
// @route     POST /api/v1/ai/quiz
// @access    Private
exports.generateQuiz = async (req, res) => {
    try {
        const { documentId, numQuestions, difficulty } = req.body;
        const text = await getDocumentText(documentId, req.user.id);
        const textSample = text.substring(0, 40000);

        const quizQuestions = await geminiService.generateQuiz(textSample, numQuestions || 5, difficulty || 'medium');

        const quiz = await Quiz.create({
            user: req.user.id,
            document: documentId,
            questions: quizQuestions,
            totalQuestions: quizQuestions.length
        });

        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Chat with document
// @route     POST /api/v1/ai/chat
// @access    Private
exports.chatWithDocument = async (req, res) => {
    try {
        const { documentId, question, history } = req.body;
        // Fetch the document to access its summary
        const document = await Document.findById(documentId);
        if (!document) throw new Error('Document not found');
        if (document.user.toString() !== req.user.id) throw new Error('Not authorized');

        const responseText = await geminiService.chatWithDocument(
            history,
            question,
            document.summary || "No summary available. Analyze the document context."
        );

        res.status(200).json({ success: true, data: responseText });
    } catch (err) {
        console.error("AI Chat Error Details:", err);
        res.status(500).json({ success: false, error: 'AI Error: ' + err.message });
    }
};
