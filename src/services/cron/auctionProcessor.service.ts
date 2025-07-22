import { Op } from 'sequelize';
import Product, { ProductType } from '../../database/models/Product';
import Bid from '../../database/models/Bid';
import Order, { OrderType, PaymentStatus } from '../../database/models/Order';
import OrderItem from '../../database/models/OrderItem';
import User from '../../database/models/User';
import FCMService from '../notification/fcm.service';
import Logger from '../../core/Logger';
import { BadRequestError, NotFoundError } from '../../core/ApiError';

export interface AuctionResult {
  productId: number;
  productName: string;
  winnerId: number;
  winnerEmail: string;
  winningBidAmount: number;
  orderId: number;
  orderNumber: string;
}

export interface AuctionSummary {
  processed: number;
  results: AuctionResult[];
  errors: string[];
}

export class AuctionProcessorService {
  static async processEndedAuctions(): Promise<AuctionSummary> {
    const summary: AuctionSummary = {
      processed: 0,
      results: [],
      errors: []
    };

    try {
      Logger.info('🔄 Starting auction processing...');

      const endedAuctions = await Product.findAll({
        where: {
          type: ProductType.AUCTION,
          auctionEndTime: {
            [Op.lte]: new Date()
          },
          isActive: true
        }
      });

      Logger.info(`Found ${endedAuctions.length} ended auctions to process`);

      for (const auction of endedAuctions) {
        try {
          const result = await this.processAuction(auction);
          summary.processed++; // Count as processed regardless of result
          if (result) {
            summary.results.push(result);
          }
        } catch (error) {
          const errorMsg = `Failed to process auction ${auction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          Logger.error(errorMsg);
          summary.errors.push(errorMsg);
        }
      }

      Logger.info(`✅ Auction processing completed. Processed: ${summary.processed}, Errors: ${summary.errors.length}`);
      return summary;

    } catch (error) {
      const errorMsg = `Auction processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      Logger.error(errorMsg);
      summary.errors.push(errorMsg);
      return summary;
    }
  }

  private static async processAuction(auction: Product): Promise<AuctionResult | null> {
    Logger.info(`Processing auction: ${auction.name} (ID: ${auction.id})`);

    if (!auction.isAuctionEnded) {
      Logger.warn(`Auction ${auction.id} is not actually ended yet`);
      return null;
    }

    const winningBid = await Bid.findOne({
      where: {
        productId: auction.id,
        isWinningBid: true
      },
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ]
    });

    if (!winningBid) {
      Logger.warn(`No winning bid found for auction ${auction.id}`);
      await this.handleNoWinningBid(auction);
      return null;
    }

    const winner = winningBid.user;
    if (!winner) {
      throw new NotFoundError(`Winner user not found for bid ${winningBid.id}`);
    }

    const existingOrder = await Order.findOne({
      where: {
        userId: winner.id,
        orderType: OrderType.AUCTION,
        status: 'pending'
      },
      include: [
        {
          model: OrderItem,
          where: { productId: auction.id }
        }
      ]
    });

    if (existingOrder) {
      Logger.info(`Order already exists for auction ${auction.id} and user ${winner.id}`);
      return {
        productId: auction.id,
        productName: auction.name,
        winnerId: winner.id,
        winnerEmail: winner.email,
        winningBidAmount: winningBid.bidAmount,
        orderId: existingOrder.id,
        orderNumber: existingOrder.orderNumber
      };
    }

    const order = await this.createAuctionOrder(auction, winner, winningBid);
    
    await this.updateAuctionStatus(auction, winningBid);

    // Send FCM notification to auction winner
    await FCMService.sendAuctionWonNotification(
      winner.id,
      auction.id,
      auction.name,
      winningBid.bidAmount
    );

    return {
      productId: auction.id,
      productName: auction.name,
      winnerId: winner.id,
      winnerEmail: winner.email,
      winningBidAmount: winningBid.bidAmount,
      orderId: order.id,
      orderNumber: order.orderNumber
    };
  }

  private static async createAuctionOrder(
    auction: Product, 
    winner: User, 
    winningBid: Bid
  ): Promise<Order> {
    Logger.info(`Creating order for auction ${auction.id} winner ${winner.id}`);

    const orderNumber = `AUCTION-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const order = await Order.create({
      userId: winner.id,
      orderNumber,
      status: 'pending',
      paymentStatus: PaymentStatus.PENDING_PAYMENT,
      orderType: OrderType.AUCTION,
      subtotal: winningBid.bidAmount,
      taxAmount: 0,
      shippingAmount: 0,
      totalAmount: winningBid.bidAmount,
      firstName: winner.firstName,
      lastName: winner.lastName,
      email: winner.email,
      phoneNumber: winner.phoneNumber || '',
      note: `Auction winner for: ${auction.name}`,
      reservationDate: new Date()
    });

    await OrderItem.create({
      orderId: order.id,
      productId: auction.id,
      productName: auction.name,
      quantity: 1,
      unitPrice: winningBid.bidAmount,
      totalPrice: winningBid.bidAmount,
      productData: {
        id: auction.id,
        name: auction.name,
        description: auction.description,
        type: auction.type,
        images: auction.images,
        coverImage: auction.coverImage,
        auctionEndTime: auction.auctionEndTime,
        winningBidId: winningBid.id
      }
    });

    Logger.info(`✅ Order created: ${order.orderNumber} for auction ${auction.id}`);
    return order;
  }

  private static async updateAuctionStatus(auction: Product, winningBid: Bid): Promise<void> {
    await auction.update({
      isActive: false,
      currentHighestBid: winningBid.bidAmount
    });

    Logger.info(`Updated auction ${auction.id} status to inactive`);
  }

  private static async handleNoWinningBid(auction: Product): Promise<void> {
    Logger.warn(`No winning bid for auction ${auction.id}, marking as inactive`);
    
    await auction.update({
      isActive: false
    });

    // Note: We could send notifications to auction creator or interested users here
    // For now, we'll just log that no one won
    Logger.info(`Auction ${auction.id} ended with no winning bids`);
  }

  static async getAuctionStatus(auctionId: number): Promise<{
    isEnded: boolean;
    isActive: boolean;
    hasWinner: boolean;
    winnerInfo?: {
      userId: number;
      email: string;
      bidAmount: number;
      orderId?: number;
    };
  }> {
    const auction = await Product.findByPk(auctionId);
    if (!auction) {
      throw new NotFoundError('Auction not found');
    }

    const isEnded = auction.isAuctionEnded;
    const isActive = auction.isActive;

    // Check for winning bid regardless of active status
    const winningBid = await Bid.findOne({
      where: {
        productId: auctionId,
        isWinningBid: true
      },
      include: [
        {
          model: User,
          attributes: ['id', 'email']
        }
      ]
    });

    if (!isEnded) {
      return { isEnded, isActive, hasWinner: false };
    }

    if (!winningBid) {
      return { isEnded, isActive, hasWinner: false };
    }

    const order = await Order.findOne({
      where: {
        userId: winningBid.userId,
        orderType: OrderType.AUCTION,
        status: 'pending'
      },
      include: [
        {
          model: OrderItem,
          where: { productId: auctionId }
        }
      ]
    });

    return {
      isEnded,
      isActive,
      hasWinner: true,
      winnerInfo: {
        userId: winningBid.userId,
        email: winningBid.user?.email || '',
        bidAmount: winningBid.bidAmount,
        orderId: order?.id
      }
    };
  }
} 