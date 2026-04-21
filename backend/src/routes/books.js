/**
 * Books Routes
 * Per AGENTS.md Part 6.6 — Book Tracker & Reading System
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { auditLog } = require('../middleware/auditLog');
const { validateInput } = require('../middleware/validateInput');
const { body, param } = require('express-validator');
const { pool } = require('../db/connection');

/**
 * GET /api/books
 * Get all books for the user
 */
router.get(
  '/',
  authenticate,
  auditLog('view_books'),
  async (req, res) => {
    try {
const result = await pool.query(
      `SELECT b.*,
      (SELECT COALESCE(SUM(pages_read), 0) FROM reading_sessions WHERE book_id = b.id) as total_pages_read
      FROM books b
      WHERE b.user_id = $1
      ORDER BY
      CASE WHEN b.is_complete THEN 1 ELSE 0 END,
      b.date_started DESC NULLS LAST`,
      [req.user.id]
    );

    const books = result.rows;

    // Add progress to each book
    const booksWithProgress = books.map((book) => ({
        ...book,
        pages_read: parseInt(book.total_pages_read) || 0,
        progress_percent: book.total_pages > 0
          ? Math.round(((parseInt(book.total_pages_read) || 0) / book.total_pages) * 100)
          : 0,
      }));

      res.json({ books: booksWithProgress });
    } catch (err) {
      console.error('Error fetching books:', err);
      res.status(500).json({ error: 'Failed to fetch books' });
    }
  }
);

/**
 * GET /api/books/:id
 * Get a specific book
 */
router.get(
  '/:id',
  authenticate,
  auditLog('view_book'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;

const bookResult = await pool.query(
      `SELECT b.*,
      (SELECT COALESCE(SUM(pages_read), 0) FROM reading_sessions WHERE book_id = b.id) as total_pages_read
      FROM books b
      WHERE b.id = $1 AND b.user_id = $2`,
      [id, req.user.id]
    );

    const book = bookResult.rows;

    if (book.length === 0) {
        return res.status(404).json({ error: 'Book not found' });
      }

// Get reading sessions
    const sessionsResult = await pool.query(
      `SELECT * FROM reading_sessions
      WHERE book_id = $1 AND user_id = $2
      ORDER BY session_date DESC`,
      [id, req.user.id]
    );

    const sessions = sessionsResult.rows;

    res.json({
      book: {
        ...book[0],
        pages_read: parseInt(book[0].total_pages_read) || 0,
        progress_percent: book[0].total_pages > 0
        ? Math.round(((parseInt(book[0].total_pages_read) || 0) / book[0].total_pages) * 100)
        : 0,
        sessions,
      },
    });
    } catch (err) {
      console.error('Error fetching book:', err);
      res.status(500).json({ error: 'Failed to fetch book' });
    }
  }
);

/**
 * POST /api/books
 * Add a new book
 */
router.post(
  '/',
  authenticate,
  auditLog('add_book'),
  validateInput([
    body('title').notEmpty().withMessage('Book title is required'),
  ]),
  async (req, res) => {
    try {
      const { title, author, total_pages, category } = req.body;

const result = await pool.query(
      `INSERT INTO books
      (user_id, title, author, total_pages, category, date_started)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
      RETURNING *`,
      [
        req.user.id,
        title,
        author,
        total_pages || null,
        category || 'personal',
      ]
    );

    res.status(201).json({ book: result.rows[0] });
    } catch (err) {
      console.error('Error adding book:', err);
      res.status(500).json({ error: 'Failed to add book' });
    }
  }
);

/**
 * PUT /api/books/:id
 * Update a book
 */
router.put(
  '/:id',
  authenticate,
  auditLog('update_book'),
  validateInput([
    param('id').isUUID(),
    body('title').notEmpty().withMessage('Book title is required'),
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, author, total_pages, category, notes } = req.body;

const result = await pool.query(
      `UPDATE books SET
      title = $1, author = $2, total_pages = $3, category = $4, notes = $5,
      updated_at = NOW()
      WHERE id = $6 AND user_id = $7
      RETURNING *`,
      [title, author, total_pages, category, notes, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ book: result.rows[0] });
    } catch (err) {
      console.error('Error updating book:', err);
      res.status(500).json({ error: 'Failed to update book' });
    }
  }
);

/**
 * DELETE /api/books/:id
 * Delete a book
 */
router.delete(
  '/:id',
  authenticate,
  auditLog('delete_book'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Delete reading sessions first (cascade)
      await pool.query(
        'DELETE FROM reading_sessions WHERE book_id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      const result = await pool.query(
        'DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, req.user.id]
      );

if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting book:', err);
      res.status(500).json({ error: 'Failed to delete book' });
    }
  }
);

/**
 * POST /api/books/:id/complete
 * Mark a book as complete
 */
router.post(
  '/:id/complete',
  authenticate,
  auditLog('complete_book'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;

const result = await pool.query(
      `UPDATE books SET
      is_complete = true, date_completed = CURRENT_DATE, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ book: result.rows[0] });
    } catch (err) {
      console.error('Error completing book:', err);
      res.status(500).json({ error: 'Failed to complete book' });
    }
  }
);

// ===== READING SESSIONS =====

/**
 * POST /api/books/:id/sessions
 * Log a reading session
 */
router.post(
  '/:id/sessions',
  authenticate,
  auditLog('log_reading_session'),
  validateInput([
    param('id').isUUID(),
    body('pages_read').isInt({ min: 1 }).withMessage('Pages read must be at least 1'),
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { pages_read, notes } = req.body;

// Verify book exists
    const bookResult = await pool.query(
      'SELECT * FROM books WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    const book = bookResult.rows;

    if (book.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Create session
    const sessionResult = await pool.query(
      `INSERT INTO reading_sessions
      (book_id, user_id, pages_read, session_date, notes)
      VALUES ($1, $2, $3, CURRENT_DATE, $4)
      RETURNING *`,
      [id, req.user.id, pages_read, notes]
    );

    // Check if book is now complete
    const totalReadResult = await pool.query(
      'SELECT COALESCE(SUM(pages_read), 0) as total FROM reading_sessions WHERE book_id = $1',
      [id]
    );

    const totalRead = totalReadResult.rows;

    if (book[0].total_pages && parseInt(totalRead[0].total) >= book[0].total_pages) {
      await pool.query(
        `UPDATE books SET is_complete = true, date_completed = CURRENT_DATE
        WHERE id = $1`,
        [id]
      );
    }

    res.status(201).json({ session: sessionResult.rows[0] });
    } catch (err) {
      console.error('Error logging session:', err);
      res.status(500).json({ error: 'Failed to log session' });
    }
  }
);

module.exports = router;
