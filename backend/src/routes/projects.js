/**
 * Projects Routes
 * Per AGENTS.md Part 6.8 — Project, Learning & Job Tracker
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const auditLog = require('../middleware/auditLog');
const validateInput = require('../middleware/validateInput');
const { body, param } = require('express-validator');
const db = require('../db/connection');

// ===== PROJECTS =====

/**
 * GET /api/projects
 * Get all projects for the user
 */
router.get(
  '/',
  authenticate,
  auditLog('view_projects'),
  async (req, res) => {
    try {
      const projects = await db.query(
        `SELECT p.*,
          COUNT(t.id) FILTER (WHERE t.is_complete = true) as completed_tasks,
          COUNT(t.id) as total_tasks
         FROM projects p
         LEFT JOIN tasks t ON p.id = t.project_id
         WHERE p.user_id = $1 AND p.status != 'archived'
         GROUP BY p.id
         ORDER BY
           CASE p.status
             WHEN 'active' THEN 1
             WHEN 'paused' THEN 2
             WHEN 'completed' THEN 3
           END,
           p.target_date ASC NULLS LAST`,
        [req.user.id]
      );

      res.json({ projects });
    } catch (err) {
      console.error('Error fetching projects:', err);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }
);

/**
 * POST /api/projects
 * Create a new project
 */
router.post(
  '/',
  authenticate,
  auditLog('create_project'),
  validateInput([
    body('name').notEmpty().withMessage('Project name is required'),
    body('status').isIn(['active', 'paused', 'completed']).optional(),
  ]),
  async (req, res) => {
    try {
      const { name, description, category, status, target_date } = req.body;

      const project = await db.query(
        `INSERT INTO projects
         (user_id, name, description, category, status, target_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.user.id,
          name,
          description,
          category || 'personal',
          status || 'active',
          target_date || null,
        ]
      );

      res.status(201).json({ project: project[0] });
    } catch (err) {
      console.error('Error creating project:', err);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put(
  '/:id',
  authenticate,
  auditLog('update_project'),
  validateInput([
    param('id').isUUID(),
    body('name').notEmpty().withMessage('Project name is required'),
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, category, status, progress_percent, target_date } = req.body;

      const project = await db.query(
        `UPDATE projects SET
         name = $1, description = $2, category = $3, status = $4,
         progress_percent = $5, target_date = $6, updated_at = NOW()
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [
          name,
          description,
          category,
          status,
          progress_percent,
          target_date,
          id,
          req.user.id,
        ]
      );

      if (project.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({ project: project[0] });
    } catch (err) {
      console.error('Error updating project:', err);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

/**
 * DELETE /api/projects/:id
 * Archive a project
 */
router.delete(
  '/:id',
  authenticate,
  auditLog('archive_project'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;

      await db.query(
        `UPDATE projects SET status = 'archived', updated_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        [id, req.user.id]
      );

      res.json({ success: true });
    } catch (err) {
      console.error('Error archiving project:', err);
      res.status(500).json({ error: 'Failed to archive project' });
    }
  }
);

// ===== TASKS =====

/**
 * GET /api/projects/:id/tasks
 * Get tasks for a project
 */
router.get(
  '/:id/tasks',
  authenticate,
  auditLog('view_tasks'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const tasks = await db.query(
        `SELECT * FROM tasks
         WHERE project_id = $1 AND user_id = $2
         ORDER BY display_order ASC, created_at ASC`,
        [id, req.user.id]
      );

      res.json({ tasks });
    } catch (err) {
      console.error('Error fetching tasks:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
);

/**
 * POST /api/projects/:id/tasks
 * Create a task for a project
 */
router.post(
  '/:id/tasks',
  authenticate,
  auditLog('create_task'),
  validateInput([
    param('id').isUUID(),
    body('title').notEmpty().withMessage('Task title is required'),
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, display_order } = req.body;

      const task = await db.query(
        `INSERT INTO tasks (project_id, user_id, title, display_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [id, req.user.id, title, display_order || 0]
      );

      // Update project progress
      await updateProjectProgress(id, req.user.id);

      res.status(201).json({ task: task[0] });
    } catch (err) {
      console.error('Error creating task:', err);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

/**
 * PUT /api/tasks/:taskId
 * Update a task
 */
router.put(
  '/tasks/:taskId',
  authenticate,
  auditLog('update_task'),
  validateInput([
    param('taskId').isUUID(),
    body('title').notEmpty().withMessage('Task title is required'),
  ]),
  async (req, res) => {
    try {
      const { taskId } = req.params;
      const { title, is_complete } = req.body;

      const task = await db.query(
        `UPDATE tasks SET
         title = $1,
         is_complete = $2,
         completed_at = CASE WHEN $2 = true THEN NOW() ELSE NULL END,
         updated_at = NOW()
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [title, is_complete, taskId, req.user.id]
      );

      if (task.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Update project progress
      await updateProjectProgress(task[0].project_id, req.user.id);

      res.json({ task: task[0] });
    } catch (err) {
      console.error('Error updating task:', err);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
);

/**
 * DELETE /api/tasks/:taskId
 * Delete a task
 */
router.delete(
  '/tasks/:taskId',
  authenticate,
  auditLog('delete_task'),
  validateInput([param('taskId').isUUID()]),
  async (req, res) => {
    try {
      const { taskId } = req.params;

      const task = await db.query(
        `SELECT project_id FROM tasks WHERE id = $1 AND user_id = $2`,
        [taskId, req.user.id]
      );

      if (task.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const projectId = task[0].project_id;

      await db.query(
        `DELETE FROM tasks WHERE id = $1 AND user_id = $2`,
        [taskId, req.user.id]
      );

      // Update project progress
      await updateProjectProgress(projectId, req.user.id);

      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting task:', err);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
);

/**
 * Helper: Update project progress based on task completion
 */
async function updateProjectProgress(projectId, userId) {
  const result = await db.query(
    `SELECT
      COUNT(*) FILTER (WHERE is_complete = true) as completed,
      COUNT(*) as total
     FROM tasks
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  );

  const { completed, total } = result[0];
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  await db.query(
    `UPDATE projects SET progress_percent = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3`,
    [progress, projectId, userId]
  );
}

module.exports = router;
