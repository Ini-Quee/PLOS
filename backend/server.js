require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { runMigrations, pool } = require('./src/db/connection');
const { globalAuditLog } = require('./src/middleware/auditLog');
const authRoutes = require('./src/routes/auth');
const journalRoutes = require('./src/routes/journal');
const scheduleRoutes = require('./src/routes/schedule');
const projectsRoutes = require('./src/routes/projects');
const booksRoutes = require('./src/routes/books');
const jobsRoutes = require('./src/routes/jobs');
const contentRoutes = require('./src/routes/content');
const goalsRoutes = require('./src/routes/goals');
const contactsRoutes = require('./src/routes/contacts');
const lumiRoutes = require('./src/routes/lumi');
const budgetRoutes = require('./src/routes/budget');
const savingsRoutes = require('./src/routes/savings');
const journalPagesRoutes = require('./src/routes/journalPages');
const lifeAuditRoutes = require('./src/routes/lifeAudit');
const oauthRoutes     = require('./src/routes/oauth');
const gmailRoutes     = require('./src/routes/gmail');
const { router: habitsRoutes, sendWeeklyPartnerEmails } = require('./src/routes/habits');
const demoRoutes   = require('./src/routes/demo');
const { router: pushRoutes, sendPushToUser } = require('./src/routes/push');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'blob:'],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('combined'));

app.use('/api/auth', authRoutes);

// Global audit log — captures every mutation across all routes
app.use('/api', globalAuditLog);

app.use('/api/journal', journalRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/lumi', lumiRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/journal/pages', journalPagesRoutes);
app.use('/api/lumi/life-audit', lifeAuditRoutes);
app.use('/api/oauth',  oauthRoutes);
app.use('/api/gmail',  gmailRoutes);
app.use('/api/demo',   demoRoutes);
app.use('/api/push',   pushRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'An internal error occurred',
  });
});

async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log('PLOS API running on http://localhost:' + PORT);
    });

    // Weekly partner emails — every Monday at 8am
    try {
      const cron = require('node-cron');
      cron.schedule('0 8 * * 1', async () => {
        console.log('[Cron] Sending weekly partner habit emails…');
        try {
          const { rows } = await pool.query(
            `SELECT DISTINCT hc.user_id FROM habit_commitments hc
             JOIN habits h ON h.id = hc.habit_id AND h.is_active = true`
          );
          for (const row of rows) {
            await sendWeeklyPartnerEmails(row.user_id).catch(e =>
              console.error('[Cron] partner email error for user', row.user_id, e.message)
            );
          }
          console.log(`[Cron] Partner emails sent to ${rows.length} users`);
        } catch (err) {
          console.error('[Cron] Weekly email job failed:', err.message);
        }
      });
      console.log('[Cron] Weekly partner email job scheduled (Mon 8am)');

      // Push notification cron — runs every minute, fires reminders on time
      cron.schedule('* * * * *', async () => {
        try {
          const now = new Date();
          const hh  = String(now.getHours()).padStart(2, '0');
          const mm  = String(now.getMinutes()).padStart(2, '0');
          const nowTime = `${hh}:${mm}`;

          // Find schedule items whose reminder is due right now
          const { rows } = await pool.query(
            `SELECT s.user_id, s.title, s.category, sc.streak
             FROM schedules s
             LEFT JOIN LATERAL (
               SELECT COUNT(*) AS streak FROM schedule_completions
               WHERE schedule_id = s.id AND user_id = s.user_id
                 AND completion_date >= CURRENT_DATE - 6
             ) sc ON true
             WHERE s.is_active = true
               AND s.reminder_minutes IS NOT NULL
               AND (
                 s.start_time::time - (s.reminder_minutes || ' minutes')::interval
               )::time BETWEEN $1::time AND ($1::time + '1 minute'::interval)
               AND (
                 s.repeat_pattern = 'daily'
                 OR (s.repeat_pattern = 'weekdays' AND EXTRACT(DOW FROM NOW()) BETWEEN 1 AND 5)
                 OR (s.repeat_pattern = 'weekly' AND EXTRACT(DOW FROM NOW()) = ANY(s.repeat_days))
                 OR (s.repeat_pattern = 'none' AND s.target_date = CURRENT_DATE)
               )`,
            [nowTime]
          );

          for (const row of rows) {
            const streak = Number(row.streak || 0);
            const body = streak >= 3
              ? `🔥 ${streak}-day streak on the line. Don't miss it.`
              : `Time to show up for yourself today.`;

            await sendPushToUser(row.user_id, {
              title: `Time for: ${row.title}`,
              body,
              icon: '/icons/icon-192.png',
              tag: `reminder-${row.user_id}-${row.title}`,
              url: '/schedule',
            }).catch(() => {});
          }
        } catch (err) {
          // Silently ignore — cron errors should never crash the server
        }
      });
      console.log('[Cron] Push notification reminder job scheduled (every minute)');
    } catch {
      console.warn('[Cron] node-cron not available — weekly emails disabled');
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();