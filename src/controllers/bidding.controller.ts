import { Request, Response, NextFunction } from 'express';
import BiddingService from '../services/bidding/bidding.service';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import Logger from '../core/Logger';
import Product from '../database/models/Product';

export const placeBid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, bidAmount, note } = req.body;
    const userId = (req as any).user.id;
    
    if (!productId || isNaN(Number(productId))) {
      throw new BadRequestError('Valid product ID is required');
    }

    if (!bidAmount || bidAmount <= 0) {
      throw new BadRequestError('Valid bid amount is required');
    }

    const result = await BiddingService.placeBid(userId, {
      productId: Number(productId),
      bidAmount: Number(bidAmount),
      note,
    });

    return new SuccessResponse(result.message, result).send(res);
  } catch (error) {
    next(error);
  }
};

export const getProductBids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const productIdNum = Number(productId);
    
    if (isNaN(productIdNum)) {
      throw new BadRequestError('Invalid product ID');
    }

    const product = await Product.findByPk(productIdNum);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.type !== 'auction') {
      throw new BadRequestError('Product is not an auction');
    }

    const bids = await BiddingService.getProductBids(productIdNum);
    return new SuccessResponse('Bids retrieved successfully', { bids }).send(res);
  } catch (error) {
    next(error);
  }
};

export const getUserBids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const bids = await BiddingService.getUserBids(userId);

    return new SuccessResponse('User bids retrieved successfully', { bids }).send(res);
  } catch (error) {
    next(error);
  }
};

export const getWinningBid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const productIdNum = Number(productId);
    
    if (isNaN(productIdNum)) {
      throw new BadRequestError('Invalid product ID');
    }

    const product = await Product.findByPk(productIdNum);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.type !== 'auction') {
      throw new BadRequestError('Product is not an auction');
    }

    const winningBid = await BiddingService.getWinningBid(productIdNum);
    return new SuccessResponse('Winning bid retrieved successfully', { winningBid }).send(res);
  } catch (error) {
    next(error);
  }
};

export const cancelBid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bidId } = req.params;
    const userId = (req as any).user.id;

    const bidIdNum = Number(bidId);
    if (isNaN(bidIdNum)) {
      throw new BadRequestError('Invalid bid ID');
    }

    const success = await BiddingService.cancelBid(userId, bidIdNum);
    return new SuccessResponse('Bid cancelled successfully', { success }).send(res);
  } catch (error) {
    next(error);
  }
};

export const getAuctionStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const productIdNum = Number(productId);
    
    if (isNaN(productIdNum)) {
      throw new BadRequestError('Invalid product ID');
    }

    const product = await Product.findByPk(productIdNum);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.type !== 'auction') {
      throw new BadRequestError('Product is not an auction');
    }

    const stats = await BiddingService.getAuctionStats(productIdNum);
    return new SuccessResponse('Auction stats retrieved successfully', { stats }).send(res);
  } catch (error) {
    next(error);
  }
}; 