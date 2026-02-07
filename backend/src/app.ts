import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import securityMiddleware from './middleware/SecurityMiddleware';
import { sanitizeInput } from './middleware/validation';
import { rateLimit } from './middleware/auth';
import logger from './utils/logger';
import { getStripeService } from './services/stripe.service';
import apiV1Routes from './api/v1/routes';

export function createApp(): Express {
  const app: Express = express();

  // ======================
  // SECURITY MIDDLEWARE
  // ======================
  app.use(securityMiddleware.helmetConfig());

  // CORS Configuration
  if (process.env.NODE_ENV !== 'production') {
    app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
  } else {
    app.use(cors(securityMiddleware.corsOptions()));
  }

  app.use(securityMiddleware.sanitizeInputs());
  app.use(securityMiddleware.generalRateLimiter());
  app.use(sanitizeInput);
  app.use(rateLimit(100, 60000)); // 100 requests per minute

  // ======================
  // BODY PARSING
  // ======================
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // File upload middleware
  app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
    abortOnLimit: true,
    createParentPath: true,
  }));

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // ======================
  // SPECIAL ENDPOINTS (before JSON parsing)
  // ======================
  // Stripe webhook endpoint (requires raw body)
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;
    const stripeService = getStripeService();
    const result = await stripeService.handleWebhook(req.body, signature);
    res.json(result);
  });

  // ======================
  // REQUEST LOGGING
  // ======================
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.http(`${req.method} ${req.path} - IP: ${req.ip}`);
    next();
  });

  // ======================
  // HEALTH CHECK
  // ======================
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'TrustNet Backend API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // ======================
  // API ROUTES
  // ======================
  app.use('/api/v1', apiV1Routes);
  
  // Redirect old API routes to v1
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/v1')) {
      return next();
    }
    // Redirect to v1 if not already versioned
    logger.info(`Redirecting legacy route ${req.path} to /api/v1${req.path}`);
    req.url = `/v1${req.url}`;
    next();
  }, apiV1Routes);

  // ======================
  // ERROR HANDLERS
  // ======================
  // 404 handler
  app.use((req: Request, res: Response) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.path,
    });
  });

  // Error handling middleware
  app.use(securityMiddleware.errorHandler());

  return app;
}
