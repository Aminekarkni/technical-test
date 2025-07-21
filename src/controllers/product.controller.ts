import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Product, { ProductType } from '../database/models/Product';
import Category from '../database/models/Category';
import Bid from '../database/models/Bid';
import User from '../database/models/User';
import BiddingService from '../services/bidding/bidding.service';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import Logger from '../core/Logger';

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      categoryId,
      search,
      minPrice,
      maxPrice,
      isRecommended,
      isTopSeller,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = { isActive: true };

    // Filter by type
    if (type && (type === 'fixed_price' || type === 'auction')) {
      where.type = type;
    }

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Search by name
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    // Price filters
    if (minPrice || maxPrice) {
      where[Op.or] = [
        // Fixed price products
        {
          type: ProductType.FIXED_PRICE,
          price: {
            ...(minPrice && { [Op.gte]: Number(minPrice) }),
            ...(maxPrice && { [Op.lte]: Number(maxPrice) }),
          },
        },
        // Auction products
        {
          type: ProductType.AUCTION,
          currentHighestBid: {
            ...(minPrice && { [Op.gte]: Number(minPrice) }),
            ...(maxPrice && { [Op.lte]: Number(maxPrice) }),
          },
        },
      ];
    }

    // Filter by recommendations
    if (isRecommended === 'true') {
      where.isRecommended = true;
    }

    // Filter by top sellers
    if (isTopSeller === 'true') {
      where.isTopSeller = true;
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    // Add auction status to products
    const productsWithAuctionStatus = products.map(product => ({
      ...product.toJSON(),
      isAuctionActive: product.isAuctionActive,
      isAuctionEnded: product.isAuctionEnded,
    }));

    return new SuccessResponse('Products retrieved successfully', {
      products: productsWithAuctionStatus,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit)),
      },
    }).send(res);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const product = await Product.findByPk(Number(id), {
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
        },
        {
          model: Bid,
          include: [
            {
              model: User,
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
          order: [['bidAmount', 'DESC']],
          limit: 10,
        },
      ],
    } as any);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    let auctionStats = null;
    if (product.type === ProductType.AUCTION) {
      auctionStats = await BiddingService.getAuctionStats(Number(id));
    }

    let userBid = null;
    if (userId && product.type === ProductType.AUCTION) {
      userBid = await Bid.findOne({
        where: { productId: Number(id), userId },
        order: [['bidAmount', 'DESC']],
      });
    }

    const productData = {
      ...product.toJSON(),
      isAuctionActive: product.isAuctionActive,
      isAuctionEnded: product.isAuctionEnded,
      auctionStats,
      userBid,
    };

    return new SuccessResponse('Product retrieved successfully', productData).send(res);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      type,
      price,
      stockQuantity,
      startingPrice,
      auctionEndTime,
      categoryId,
      images,
      coverImage,
      isRecommended,
      isTopSeller,
    } = req.body;

    if (type === ProductType.FIXED_PRICE) {
      if (!price || price <= 0) {
        throw new BadRequestError('Price is required for fixed-price products');
      }
      if (!stockQuantity || stockQuantity < 0) {
        throw new BadRequestError('Stock quantity is required for fixed-price products');
      }
    } else if (type === ProductType.AUCTION) {
      if (!startingPrice || startingPrice <= 0) {
        throw new BadRequestError('Starting price is required for auction products');
      }
      if (!auctionEndTime) {
        throw new BadRequestError('Auction end time is required for auction products');
      }
      if (new Date(auctionEndTime) <= new Date()) {
        throw new BadRequestError('Auction end time must be in the future');
      }
    } else {
      throw new BadRequestError('Invalid product type');
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const product = await Product.create({
      name,
      description,
      type,
      price: type === ProductType.FIXED_PRICE ? price : null,
      stockQuantity: type === ProductType.FIXED_PRICE ? stockQuantity : null,
      startingPrice: type === ProductType.AUCTION ? startingPrice : null,
      currentHighestBid: type === ProductType.AUCTION ? startingPrice : null,
      auctionEndTime: type === ProductType.AUCTION ? new Date(auctionEndTime) : null,
      categoryId,
      images: images || [],
      coverImage,
      isRecommended: isRecommended || false,
      isTopSeller: isTopSeller || false,
    });

    return new SuccessResponse('Product created successfully', product).send(res);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await product.update(updateData);

    return new SuccessResponse('Product updated successfully', product).send(res);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.type === ProductType.AUCTION) {
      const bidCount = await Bid.count({ where: { productId: Number(id) } });
      if (bidCount > 0) {
        throw new BadRequestError('Cannot delete auction product that has bids');
      }
    }

    await product.destroy();

    return new SuccessResponse('Product deleted successfully', {}).send(res);
  } catch (error) {
    next(error);
  }
};

export const getRecommendedProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: products } = await Product.findAndCountAll({
      where: { isRecommended: true, isActive: true },
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
        },
      ],
      order: [['position', 'ASC']],
      limit: Number(limit),
      offset,
    });

    return new SuccessResponse('Recommended products retrieved successfully', {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit)),
      },
    }).send(res);
  } catch (error) {
    next(error);
  }
};

export const getTopSellerProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: products } = await Product.findAndCountAll({
      where: { isTopSeller: true, isActive: true },
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
        },
      ],
      order: [['position', 'ASC']],
      limit: Number(limit),
      offset,
    });

    return new SuccessResponse('Top seller products retrieved successfully', {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit)),
      },
    }).send(res);
  } catch (error) {
    next(error);
  }
};

export const getActiveAuctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: products } = await Product.findAndCountAll({
      where: {
        type: ProductType.AUCTION,
        isActive: true,
        auctionEndTime: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
        },
      ],
      order: [['auctionEndTime', 'ASC']],
      limit: Number(limit),
      offset,
    });

    const productsWithAuctionStatus = products.map(product => ({
      ...product.toJSON(),
      isAuctionActive: product.isAuctionActive,
      isAuctionEnded: product.isAuctionEnded,
    }));

    return new SuccessResponse('Active auctions retrieved successfully', {
      products: productsWithAuctionStatus,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit)),
      },
    }).send(res);
  } catch (error) {
    next(error);
  }
};
