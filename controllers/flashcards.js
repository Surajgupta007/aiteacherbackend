const Flashcard = require('../models/Flashcard');

// @desc      Get all flashcards for user
// @route     GET /api/v1/flashcards
// @access    Private
exports.getFlashcards = async (req, res) => {
    try {
        const flashcards = await Flashcard.find({ user: req.user.id });
        res.status(200).json({ success: true, count: flashcards.length, data: flashcards });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Get flashcards by document
// @route     GET /api/v1/flashcards/document/:docId
// @access    Private
exports.getFlashcardsByDocument = async (req, res) => {
    try {
        const flashcards = await Flashcard.find({ user: req.user.id, document: req.params.docId });
        res.status(200).json({ success: true, count: flashcards.length, data: flashcards });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Toggle favorite status
// @route     PUT /api/v1/flashcards/:id/favorite
// @access    Private
exports.toggleFavorite = async (req, res) => {
    try {
        let flashcard = await Flashcard.findById(req.params.id);

        if (!flashcard) return res.status(404).json({ success: false, error: 'Flashcard not found' });
        if (flashcard.user.toString() !== req.user.id) return res.status(401).json({ success: false, error: 'Not authorized' });

        flashcard = await Flashcard.findByIdAndUpdate(req.params.id, { isFavorite: !flashcard.isFavorite }, { new: true });
        res.status(200).json({ success: true, data: flashcard });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Delete flashcard
// @route     DELETE /api/v1/flashcards/:id
// @access    Private
exports.deleteFlashcard = async (req, res) => {
    try {
        const flashcard = await Flashcard.findById(req.params.id);

        if (!flashcard) return res.status(404).json({ success: false, error: 'Flashcard not found' });
        if (flashcard.user.toString() !== req.user.id) return res.status(401).json({ success: false, error: 'Not authorized' });

        await flashcard.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
