import { Op } from 'sequelize';
import Product, { ProductType } from '../../database/models/Product';
import Bid from '../../database/models/Bid';
import User from '../../database/models/User';
import Order, { OrderType, PaymentStatus } from '../../database/models/Order';
import OrderItem from '../../database/models/OrderItem';
import FCMService from '../notification/fcm.service';
import MyFatoorahService from '../payment/myfatoorah.service';
import Logger from '../../core/Logger';
import { BadRequestError, NotFoundError } from '../../core/ApiError';

export interface BidRequest {
  productId: number;
  bidAmount: number;
  note?: string;
}

export interface BidResponse {
  success: boolean;
  message: string;
  bid?: Bid;
  isWinningBid?: boolean;
}

export class BiddingService {
  static async placeBid(
    userId: number,
    bidRequest: BidRequest
  ): Promise<BidResponse> {
    try {
      const product = await Product.findByPk(bidRequest.productId);
      if (!product) {
        throw new NotFoundError('Product not found');
      }

      if (product.type !== ProductType.AUCTION) {
        throw new BadRequestError('This product is not an auction');
      }

      if (!product.isAuctionActive) {
        throw new BadRequestError('Auction has ended');
      }

      if (bidRequest.bidAmount <= 0) {
        throw new BadRequestError('Bid amount must be greater than 0');
      }

      const currentHighestBid = product.currentHighestBid || product.startingPrice || 0;
      if (bidRequest.bidAmount <= currentHighestBid) {
        throw new BadRequestError(`Bid must be higher than current highest bid: $${currentHighestBid}`);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const bid = await Bid.create({
        userId,
        productId: bidRequest.productId,
        bidAmount: bidRequest.bidAmount,
        note: bidRequest.note,
        isWinningBid: true,
      });

      await product.update({
        currentHighestBid: bidRequest.bidAmount,
      });

      await Bid.update(
        { isWinningBid: false },
        {
          where: {
            productId: bidRequest.productId,
            id: { [Op.ne]: bid.id },
          },
        }
      );

      const previousWinningBid = await Bid.findOne({
        where: {
          productId: bidRequest.productId,
          id: { [Op.ne]: bid.id },
          isWinningBid: false,
        },
        order: [['bidAmount', 'DESC']],
        include: [{ model: User }],
      });

      if (previousWinningBid && previousWinningBid.userId !== userId) {
        await FCMService.sendOutbidNotification(
          previousWinningBid.userId,
          product.id,
          product.name,
          bidRequest.bidAmount
        );
      }

      Logger.info(`Bid placed successfully: User ${userId} bid $${bidRequest.bidAmount} on product ${product.id}`);

      return {
        success: true,
        message: 'Bid placed successfully',
        bid,
        isWinningBid: true,
      };
    } catch (error) {
      Logger.error('Error placing bid:', error);
      throw error;
    }
  }

  static async getProductBids(productId: number): Promise<Bid[]> {
    return Bid.findAll({
      where: { productId },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['bidAmount', 'DESC']],
    });
  }

  static async getUserBids(userId: number): Promise<Bid[]> {
    return Bid.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'type', 'currentHighestBid', 'auctionEndTime'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  static async getWinningBid(productId: number): Promise<Bid | null> {
    return Bid.findOne({
      where: { productId, isWinningBid: true },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });
  }

  static async processEndedAuctions(): Promise<void> {
    try {
      const endedAuctions = await Product.findAll({
        where: {
          type: ProductType.AUCTION,
          auctionEndTime: { [Op.lte]: new Date() },
          currentHighestBid: { [Op.gt]: 0 },
        },
        include: [
          {
            model: Bid,
            where: { isWinningBid: true },
            include: [{ model: User }],
          },
        ],
      });

      for (const auction of endedAuctions) {
        const winningBid = auction.bids[0];
        if (!winningBid) continue;

        const existingOrder = await Order.findOne({
          where: {
            userId: winningBid.userId,
            orderType: OrderType.AUCTION,
            paymentStatus: PaymentStatus.PENDING_PAYMENT,
          },
        });

        if (existingOrder) {
          Logger.info(`Order already exists for auction ${auction.id}`);
          continue;
        }

        const order = await Order.create({
          userId: winningBid.userId,
          orderNumber: `AUCTION-${auction.id}-${Date.now()}`,
          orderType: OrderType.AUCTION,
          status: 'pending',
          paymentStatus: PaymentStatus.PENDING_PAYMENT,
          subtotal: winningBid.bidAmount,
          taxAmount: 0,
          shippingAmount: 0,
          totalAmount: winningBid.bidAmount,
          firstName: winningBid.user.firstName,
          lastName: winningBid.user.lastName,
          email: winningBid.user.email,
          phoneNumber: winningBid.user.phoneNumber,
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
            price: winningBid.bidAmount,
            images: auction.images,
          },
        });

        await FCMService.sendAuctionWonNotification(
          winningBid.userId,
          auction.id,
          auction.name,
          winningBid.bidAmount
        );

        Logger.info(`Order created for auction ${auction.id}: Order ${order.id}`);
      }
    } catch (error) {
      Logger.error('Error processing ended auctions:', error);
      throw error;
    }
  }

  static async getAuctionStats(productId: number): Promise<{
    totalBids: number;
    highestBid: number;
    lowestBid: number;
    averageBid: number;
    uniqueBidders: number;
  }> {
    const bids = await Bid.findAll({
      where: { productId },
      attributes: ['bidAmount', 'userId'],
    });

    if (bids.length === 0) {
      return {
        totalBids: 0,
        highestBid: 0,
        lowestBid: 0,
        averageBid: 0,
        uniqueBidders: 0,
      };
    }

    const bidAmounts = bids.map(bid => bid.bidAmount);
    const uniqueBidders = new Set(bids.map(bid => bid.userId)).size;

    return {
      totalBids: bids.length,
      highestBid: Math.max(...bidAmounts),
      lowestBid: Math.min(...bidAmounts),
      averageBid: bidAmounts.reduce((sum, amount) => sum + amount, 0) / bidAmounts.length,
      uniqueBidders,
    };
  }

  static async cancelBid(userId: number, bidId: number): Promise<boolean> {
    try {
      const bid = await Bid.findOne({
        where: { id: bidId, userId },
        include: [{ model: Product }],
      });

      if (!bid) {
        throw new NotFoundError('Bid not found');
      }

      if (!bid.product.isAuctionActive) {
        throw new BadRequestError('Cannot cancel bid on ended auction');
      }

      if (!bid.isWinningBid) {
        throw new BadRequestError('Can only cancel winning bid');
      }

      await bid.destroy();

      const newHighestBid = await Bid.findOne({
        where: { productId: bid.productId },
        order: [['bidAmount', 'DESC']],
      });

      if (newHighestBid) {
        await newHighestBid.update({ isWinningBid: true });
        await bid.product.update({ currentHighestBid: newHighestBid.bidAmount });
      } else {
        await bid.product.update({ currentHighestBid: bid.product.startingPrice });
      }

      Logger.info(`Bid ${bidId} cancelled by user ${userId}`);
      return true;
    } catch (error) {
      Logger.error('Error cancelling bid:', error);
      throw error;
    }
  }
}

export default BiddingService; 