require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { runMigrations, pool } = require('./src/db/connection');
const { validateEnv } = require('./src/lib/validateEnv');
const redisClient = require('./src/services/redisClient');
const logger = require('./src/lib/logger');
const { globalAuditLog } = require('./src/middleware/auditLog');
const authRoutes = require('./src/routes/auth');
const journalRoutes = require('./src/routes/journal');
const journalV2Routes = require('./src/routes/journalV2');
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
const { router: habitsRoutes } = require('./src/routes/habits');
const trackerRoutes = require('./src/routes/trackers');
const usersRoutes   = require('./src/routes/users');
const billingRoutes = require('./src/routes/billing');
const demoRoutes   = require('./src/routes/demo');
const { router: pushRoutes } = require('./src/routes/push');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use((req, res, next) => {
  req.id = req.get('x-request-id') || require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

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

const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [
  ...configuredOrigins,
  ...(isProduction ? [] : ['http://localhost:5173', 'http://localhost:5174']),
];

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

// Stripe webhook needs raw body — mount BEFORE express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('combined'));

app.use('/api/auth', authRoutes);

// Global audit log — captures every mutation across all routes
app.use('/api', globalAuditLog);

app.use('/api/journal', journalRoutes);
app.use('/api/journal/v2', journalV2Routes);
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
app.use('/api/trackers', trackerRoutes);
app.use('/api/journal/pages', journalPagesRoutes);
app.use('/api/lumi/life-audit', lifeAuditRoutes);
app.use('/api/oauth',  oauthRoutes);
app.use('/api/gmail',  gmailRoutes);
app.use('/api/demo',   demoRoutes);
app.use('/api/push',   pushRoutes);
app.use('/api/users',   usersRoutes);
app.use('/api/billing', billingRoutes);

app.get('/api/health', async (req, res) => {
  // Quick DB ping to confirm database is reachable
  let dbOk = false;
  try {
    await pool.query('SELECT 1');
    dbOk = true;
  } catch {}

  const { isAvailable } = require('./src/services/redisClient');
  res.json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'unreachable',
    redis: isAvailable() ? 'connected' : 'offline (fallback active)',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  logger.error({ requestId: req.id, method: req.method, path: req.originalUrl, err: err.message }, 'unhandled error');
  res.status(500).json({
    error: 'An internal error occurred',
    requestId: req.id,
  });
});

async function start() {
  try {
    validateEnv();
    await redisClient.init();
    await runMigrations();
    app.listen(PORT, () => {
    logger.info({ port: PORT }, 'PLOS API started');
    });

    // Spawn background worker for cron jobs (idempotent, isolated from HTTP process)
    try {
      const { fork } = require('child_process');
      const path = require('path');
      const worker = fork(path.join(__dirname, 'src/workers/cronWorker.js'), [], {
        detached: false,
        stdio: 'inherit',
      });
      worker.on('error', (err) => logger.error({ err: err.message }, 'cron worker error'));
      worker.on('exit', (code) => {
        if (code !== 0) logger.error({ code }, 'cron worker exited');
      });
      logger.info({ pid: worker.pid }, 'cron worker started');
    } catch (err) {
    logger.warn({ err: err.message }, 'cron worker not started');
    }
  } catch (error) {
    logger.error({ err: error.message }, 'server start failed');
    process.exit(1);
  }
}

start();
