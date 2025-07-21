import express, { Request, Response, NextFunction } from 'express';
import swaggerUI from 'swagger-ui-express';
import Logger from './core/Logger';
import cors from 'cors';
import { corsUrl, environment } from './configVars';
import './database'; // initialize database
import { NotFoundError, ApiError, InternalError } from './core/ApiError';
import routesV1 from './routes';
import { specs } from './docs';
import AuctionProcessorService from './services/cron/auctionProcessor.service';

process.on('uncaughtException', (e) => {
  // Logger.error(e);
  console.log(e);
});

const app = express();

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));
app.use(
  cors({ origin: corsUrl, optionsSuccessStatus: 200, credentials: true })
);

if (environment === 'development') {
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));
}
  
if (environment !== 'test') {
  AuctionProcessorService.startAuctionProcessor();
}

// Routes
app.use('/api', routesV1);
app.use(express.static('media'));
app.use('/public', express.static('public'));

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
