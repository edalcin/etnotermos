// Public Context Server for EtnoTermos (Port 4000 - Read-only)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../../config/index.js';
import { connectToDatabase } from '../../shared/database.js';

// ES Module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({ origin: config.corsOrigins }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'views', 'assets')));

// Configure EJS template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'public', port: config.publicPort });
});

// Import middlewares
import { errorHandler, notFoundHandler } from '../../api/middleware/errorHandler.js';

// Import view controller
import {
  renderHomePage,
  renderBrowsePage,
  renderSearchPage,
  renderTermDetailPage,
  renderAboutPage,
  renderExportPage,
} from '../../api/controllers/PublicViewController.js';

// View routes (HTML pages)
app.get('/', renderHomePage);
app.get('/browse', renderBrowsePage);
app.get('/search', renderSearchPage);
app.get('/terms/:id', renderTermDetailPage);
app.get('/about', renderAboutPage);
app.get('/export', renderExportPage);

// Import API routes
import termsRouter from '../../api/public/terms.js';
import relationshipsRouter from '../../api/public/relationships.js';
import searchRouter from '../../api/public/search.js';
import exportRouter from '../../api/public/export.js';

// Register API routes under /api/v1 prefix
app.use('/api/v1/terms', termsRouter);
app.use('/api/v1/relationships', relationshipsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/export', exportRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Public server error:', err);
  res.status(err.status || 500).json({
    error: {
      message: config.isDevelopment ? err.message : 'Internal Server Error',
      ...(config.isDevelopment && { stack: err.stack }),
    },
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();
    console.log('Public context: Database connected');

    // Start listening
    app.listen(config.publicPort, () => {
      console.log(`🌿 EtnoTermos PUBLIC interface running on port ${config.publicPort}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Access: http://localhost:${config.publicPort}`);
    });
  } catch (error) {
    console.error('Failed to start public server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
