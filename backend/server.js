require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { runMigrations } = require('./src/db/connection');
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
app.use('/api/journal', journalRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/lumi', lumiRoutes);

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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();