console.log('=== SERVER STARTING ===');
import Logger from './core/Logger';
console.log('=== LOGGER IMPORTED ===');
import { port } from './configVars';
console.log('=== CONFIG IMPORTED ===');
import app from './app';
console.log('=== APP IMPORTED ===');
import { CronService } from './services/cron/cron.service';
console.log('=== CRON SERVICE IMPORTED ===');

Logger.info('Starting server initialization...');
Logger.info(`Environment: ${process.env.NODE_ENV}`);
Logger.info(`Port: ${port}`);
Logger.info(`Database config: ${JSON.stringify({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  dialect: process.env.DB_DIALECT
})}`);

app
  .listen(port, () => {
    Logger.info(`server running on port : ${port} 👌`);
    
    if (process.env.NODE_ENV !== 'test') {
      CronService.startAuctionProcessor();
    }
  })
  .on('error', (e) => {
    console.log(e);
    Logger.error(e);
  });
