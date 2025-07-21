import cron from 'node-cron';
import BiddingService from '../bidding/bidding.service';
import Logger from '../../core/Logger';

export class AuctionProcessorService {
  static startAuctionProcessor(): void {
    cron.schedule('* * * * *', async () => {
      try {
        Logger.info('Processing ended auctions...');
        await BiddingService.processEndedAuctions();
        Logger.info('Auction processing completed');
      } catch (error) {
        Logger.error('Error processing ended auctions:', error);
      }
    });

    Logger.info('Auction processor cron job started');
  }

  static async processEndedAuctions(): Promise<void> {
    try {
      await BiddingService.processEndedAuctions();
      Logger.info('Manual auction processing completed');
    } catch (error) {
      Logger.error('Error in manual auction processing:', error);
      throw error;
    }
  }
}

export default AuctionProcessorService; 