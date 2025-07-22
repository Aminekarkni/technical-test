import express, { Request, Response, NextFunction } from 'express';
import swaggerUI from 'swagger-ui-express';
import Logger from './core/Logger';
import cors from 'cors';
import { corsUrl, environment } from './configVars';
import { NotFoundError, ApiError, InternalError } from './core/ApiError';
import { specs } from './docs';
// import auth from './routes/auth/router';

Logger.info('🚀 Initializing Express application...');

process.on('uncaughtException', (e) => {
  Logger.error('❌ Uncaught Exception:', e);
  console.log(e);
});

const app = express();

Logger.info('📦 Setting up middleware...');

app.use(express.json({ limit: '200mb' }));
Logger.info('✅ JSON middleware configured');

app.use(express.urlencoded({ extended: true, limit: '200mb' }));
Logger.info('✅ URL encoded middleware configured');

app.use(
  cors({ origin: corsUrl, optionsSuccessStatus: 200, credentials: true })
);
Logger.info(`✅ CORS configured for origin: ${corsUrl}`);

if (environment === 'development') {
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));
  Logger.info('✅ Swagger UI configured for development');
}
  
Logger.info('🔧 Initializing database connection asynchronously...');
setImmediate(() => {
  import('./database')
    .then(() => {
      Logger.info('✅ Database connection initialized');
      
      if (environment !== 'test') {
        Logger.info('🔄 Auction processor disabled for testing');
      }
    })
    .catch((error) => {
      Logger.error('❌ Database initialization failed:', error);
      Logger.error('Continuing without database...');
    });
});

if (environment !== 'test') {
  Logger.info('🔄 Auction processor skipped for now...');
}

Logger.info('🛣️ Setting up routes...');
try {
  const routesV1 = require('./routes').default;
  app.use('/api', routesV1);
  Logger.info('✅ All API routes configured');
} catch (error) {
  Logger.error('❌ Failed to load routes:', error);
}

app.use(express.static('media'));
app.use('/public', express.static('public'));
Logger.info('✅ Static file serving configured');

// catch 404 and forward to error handler
app.use((req, res, next) => next(new NotFoundError()));

// Middleware Error Handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    ApiError.handle(err, res);
  } else {
    if (environment === 'development' || environment === 'test') {
      // Logger.error(err);
      console.log('Error details:', err.message);
      console.log('Error stack:', err.stack);
      return res.status(500).send({ status: 'fail', message: err.message });
    }
    ApiError.handle(new InternalError(), res);
  }
});

export default app;
