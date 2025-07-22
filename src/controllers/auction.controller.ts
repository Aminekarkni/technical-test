import { Request, Response, NextFunction } from 'express';
import { AuctionProcessorService } from '../services/cron/auctionProcessor.service';
import { SuccessResponse, BadRequestResponse, NotFoundResponse } from '../core/ApiResponse';
import Logger from '../core/Logger';
import Product from '../database/models/Product';
import Order from '../database/models/Order';

export const processEndedAuctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuctionProcessorService.processEndedAuctions();
    
    return new SuccessResponse('Auctions processed successfully', result).send(res);
  } catch (error) {
    next(error);
  }
};

export const getAuctionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auctionId } = req.params;
    
    const auction = await Product.findByPk(Number(auctionId));
    if (!auction) {
      return new NotFoundResponse('Auction not found').send(res);
    }

    if (auction.type !== 'auction') {
      return new BadRequestResponse('Product is not an auction').send(res);
    }

    const status = await AuctionProcessorService.getAuctionStatus(Number(auctionId));
    
    return new SuccessResponse('Auction status retrieved successfully', status).send(res);
  } catch (error) {
    next(error);
  }
};

export const getAuctionOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auctionId } = req.params;
    
    const auction = await Product.findByPk(Number(auctionId));
    if (!auction) {
      return new NotFoundResponse('Auction not found').send(res);
    }

    if (auction.type !== 'auction') {
      return new BadRequestResponse('Product is not an auction').send(res);
    }

    const orders = await Order.findAll({
      where: {
        orderType: 'auction',
        note: {
          [require('sequelize').Op.like]: `%${auction.name}%`
        }
      },
      include: ['user', 'items']
    });
    
    return new SuccessResponse('Auction orders retrieved successfully', {
      orders,
      totalOrders: orders.length
    }).send(res);
  } catch (error) {
    next(error);
  }
}; 