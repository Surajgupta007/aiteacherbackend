const express = require('express');
const { createRevision, updateRevisionScore, getRevisions } = require('../controllers/revision');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/generate', createRevision);
router.put('/:id/score', updateRevisionScore);
router.get('/', getRevisions);

module.exports = router;
