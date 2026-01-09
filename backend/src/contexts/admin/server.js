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

// Basic authentication middleware (simple implementation)
// TODO: Enhance in Phase 3.5 with proper middleware
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="EtnoTermos Admin"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
  const [username, password] = credentials.split(':');

  if (username === config.adminUsername && password === config.adminPassword) {
    next();
  } else {
    res.set('WWW-Authenticate', 'Basic realm="EtnoTermos Admin"');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
};

// Apply basic auth to all admin routes except health check
app.use((req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  basicAuth(req, res, next);
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'admin', port: config.adminPort });
});

// Routes will be registered here in Phase 3.6
// TODO: Import and register admin routes

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
