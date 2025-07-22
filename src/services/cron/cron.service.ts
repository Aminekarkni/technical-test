import cron from 'node-cron';
import { AuctionProcessorService } from './auctionProcessor.service';
import Logger from '../../core/Logger';

export class CronService {
  private static auctionProcessorJob: cron.ScheduledTask | null = null;

  static startAuctionProcessor(): void {
    if (this.auctionProcessorJob) {
      Logger.warn('Auction processor is already running');
      return;
    }

    this.auctionProcessorJob = cron.schedule('*/5 * * * *', async () => {
      try {
        Logger.info('🕐 Running scheduled auction processing...');
        const summary = await AuctionProcessorService.processEndedAuctions();
        
        if (summary.processed > 0) {
          Logger.info(`✅ Processed ${summary.processed} auctions automatically`);
        }
        
        if (summary.errors.length > 0) {
          Logger.warn(`⚠️ ${summary.errors.length} errors during automatic processing`);
        }
      } catch (error) {
        Logger.error('❌ Error in scheduled auction processing:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    Logger.info('🕐 Auction processor cron job started (runs every 5 minutes)');
  }

  static stopAuctionProcessor(): void {
    if (this.auctionProcessorJob) {
      this.auctionProcessorJob.stop();
      this.auctionProcessorJob = null;
      Logger.info('🕐 Auction processor cron job stopped');
    }
  }

  static getAuctionProcessorStatus(): { isRunning: boolean } {
    return {
      isRunning: this.auctionProcessorJob !== null
    };
  }
} 