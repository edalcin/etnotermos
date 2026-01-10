// Admin Context Server for EtnoTermos (Port 4001 - Full CRUD)
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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"],
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

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'admin', port: config.adminPort });
});

// Import view controller
import {
  renderDashboard,
  renderTermsList,
  renderTermForm,
  renderRelationshipsList,
  renderRelationshipForm,
  renderCollectionsList,
  renderCollectionForm,
  renderAuditLogs,
} from '../../api/controllers/AdminViewController.js';

// Import admin auth middleware for view routes
import adminAuth from '../../api/middleware/adminAuth.js';

// Apply authentication to all view routes
app.use('/', adminAuth);

// View routes (HTML pages)
app.get('/', renderDashboard);
app.get('/terms', renderTermsList);
app.get('/terms/new', renderTermForm);
app.get('/terms/:id/edit', renderTermForm);
app.get('/relationships', renderRelationshipsList);
app.get('/relationships/new', renderRelationshipForm);
app.get('/collections', renderCollectionsList);
app.get('/collections/new', renderCollectionForm);
app.get('/collections/:id/edit', renderCollectionForm);
app.get('/audit', renderAuditLogs);

// Import API routes
import termsRouter from '../../api/admin/terms.js';
import relationshipsRouter from '../../api/admin/relationships.js';
import notesRouter from '../../api/admin/notes.js';
import sourcesRouter from '../../api/admin/sources.js';
import collectionsRouter from '../../api/admin/collections.js';
import dashboardRouter from '../../api/admin/dashboard.js';

// Register API routes under /api/v1 prefix
app.use('/api/v1/admin/terms', termsRouter);
app.use('/api/v1/admin/relationships', relationshipsRouter);
app.use('/api/v1/notes', notesRouter); // Notes available to both public (GET) and admin
app.use('/api/v1/sources', sourcesRouter); // Sources available to both public (GET) and admin
app.use('/api/v1/collections', collectionsRouter); // Collections available to both public (GET) and admin
app.use('/api/v1/admin/dashboard', dashboardRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Admin server error:', err);
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
    console.log('Admin context: Database connected');

    // Start listening
    app.listen(config.adminPort, () => {
      console.log(`🔒 EtnoTermos ADMIN interface running on port ${config.adminPort}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Access: http://localhost:${config.adminPort}`);
      console.log(`   Default credentials: ${config.adminUsername} / ${config.adminPassword}`);
    });
  } catch (error) {
    console.error('Failed to start admin server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
