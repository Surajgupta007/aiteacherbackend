const Revision = require('../models/Revision');
const Document = require('../models/Document');
const Quiz = require('../models/Quiz');
const Flashcard = require('../models/Flashcard');
const { extractTextFromPDF } = require('../services/pdfParser');
const geminiService = require('../services/gemini');

// Helper to get text from a Document ID
const getDocumentText = async (docId, userId) => {
    const document = await Document.findById(docId);
    if (!document) throw new Error('Document not found');
    if (document.user.toString() !== userId) throw new Error('Not authorized');

    const text = await extractTextFromPDF(document.filePath);
    return text;
};

// @desc      Generate revision plan
// @route     POST /api/v1/revision/generate
// @access    Private
exports.createRevision = async (req, res) => {
    try {
        const { documentId, duration } = req.body;

        // 1. Fetch Data
        const text = await getDocumentText(documentId, req.user.id);
        const textSample = text.substring(0, 40000); // Limit context size

        // Fetch Quizzes for this document
        const quizzes = await Quiz.find({ user: req.user.id, document: documentId });
        let totalQuizQuestions = 0;
        let totalCorrect = 0;

        quizzes.forEach(quiz => {
            totalQuizQuestions += quiz.totalQuestions;
            totalCorrect += quiz.score;
        });

        const accuracy = totalQuizQuestions > 0 ? Math.round((totalCorrect / totalQuizQuestions) * 100) : 0;

        // Fetch Flashcards (mock low retention count for now)
        const flashcards = await Flashcard.find({ user: req.user.id, document: documentId });

        const analytics = {
            accuracy,
            totalQuizzesTaken: quizzes.length,
            totalFlashcards: flashcards.length
        };

        // 2. Call Gemini
        const plan = await geminiService.generateRevisionPlan(textSample, analytics, duration || 30);

        // 3. Save to DB
        const revision = await Revision.create({
            user: req.user.id,
            document: documentId,
            duration: duration || 30,
            plan: plan
        });

        res.status(200).json({ success: true, data: revision });
    } catch (error) {
        console.error("Revision Error:", error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Get previous revisions
// @route     GET /api/v1/revision
// @access    Private
exports.getRevisions = async (req, res) => {
    try {
        const revisions = await Revision.find({ user: req.user.id })
            .populate({ path: 'document', select: 'fileName' })
            .sort('-createdAt');
        res.status(200).json({ success: true, count: revisions.length, data: revisions });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Update rapid fire score
// @route     PUT /api/v1/revision/:id/score
// @access    Private
exports.updateRevisionScore = async (req, res) => {
    try {
        const { score, total } = req.body;
        let revision = await Revision.findById(req.params.id);

        if (!revision) return res.status(404).json({ success: false, error: 'Revision not found' });
        if (revision.user.toString() !== req.user.id) return res.status(401).json({ success: false, error: 'Not authorized' });

        revision = await Revision.findByIdAndUpdate(req.params.id, { rapidFireScore: score, rapidFireTotal: total }, { new: true });
        res.status(200).json({ success: true, data: revision });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
