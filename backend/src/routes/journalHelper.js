const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { analyzeForJournal, saveConversationToJournal, getUserJournals } = require('../services/journalHelper');

const router = express.Router();

/**
 * POST /api/journal-helper/analyze
 * Analyze a conversation and suggest if it should be saved
 * This is called AFTER Lumi has finished conversing
 */
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationText } = req.body;

    if (!conversationText || conversationText.trim().length === 0) {
      return res.status(400).json({ error: 'Conversation text is required' });
    }

    const analysis = await analyzeForJournal(userId, conversationText);

    res.json({
      shouldSuggest: analysis.shouldSuggest,
      suggestedJournal: analysis.suggestedJournal,
      reasoning: analysis.reasoning,
    });
  } catch (error) {
    console.error('Journal helper analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze conversation' });
  }
});

/**
 * POST /api/journal-helper/save
 * Save conversation to journal after user confirms
 */
router.post('/save', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { journalType, conversationText, aiSummary } = req.body;

    if (!journalType || !conversationText) {
      return res.status(400).json({ error: 'Journal type and conversation text are required' });
    }

    const saved = await saveConversationToJournal(userId, journalType, conversationText, aiSummary);

    res.json({
      success: true,
      message: `Saved to your ${journalType} journal.`,
      savedData: saved,
    });
  } catch (error) {
    console.error('Journal helper save error:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

/**
 * GET /api/journal-helper/journals
 * Get available journals for user
 */
router.get('/journals', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const journals = await getUserJournals(userId);

    res.json({ journals });
  } catch (error) {
    console.error('Get journals error:', error);
    res.status(500).json({ error: 'Failed to get journals' });
  }
});

module.exports = router;
