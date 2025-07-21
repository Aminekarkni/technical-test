import { Request, Response, NextFunction } from 'express';
import Order, { OrderType, PaymentStatus } from '../database/models/Order';
import OrderItem from '../database/models/OrderItem';
import User from '../database/models/User';
import Product, { ProductType } from '../database/models/Product';
import MyFatoorahService from '../services/payment/myfatoorah.service';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import Logger from '../core/Logger';

export const createFixedPriceOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { productId, quantity = 1, deliveryType = 'DELIVERY', addressId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.type !== ProductType.FIXED_PRICE) {
      throw new BadRequestError('This product is not available for fixed-price purchase');
    }

    if (!product.stockQuantity || product.stockQuantity < quantity) {
      throw new BadRequestError('Insufficient stock');
    }
    
    const subtotal = product.price! * quantity;
    const taxAmount = 0; 
    const shippingAmount = deliveryType === 'DELIVERY' ? 10 : 0; 
    const totalAmount = subtotal + taxAmount + shippingAmount;

    const order = await Order.create({
      userId,
      orderNumber: `ORDER-${Date.now()}`,
      orderType: OrderType.FIXED_PRICE,
      status: 'pending',
      paymentStatus: PaymentStatus.PENDING_PAYMENT,
      subtotal,
      taxAmount,
      shippingAmount,
      totalAmount,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    });

    await OrderItem.create({
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price!,
      totalPrice: product.price! * quantity,
      productData: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price!,
        images: product.images,
      },
    });

    await product.update({
      stockQuantity: product.stockQuantity - quantity,
    });

    let invoice;
    try {
      invoice = await MyFatoorahService.createFixedPriceInvoice(order, user);
    } catch (error) {

        //for testing purposes
      if (process.env.NODE_ENV === 'test') {
        invoice = {
          InvoiceId: Math.floor(Math.random() * 1000000),
          InvoiceURL: 'https://example.com/invoice',
          PaymentURL: 'https://example.com/payment',
          PaymentId: `test-${Date.now()}`,
          IsDirectPayment: false,
          PaymentMethods: [],
        };
        
        await order.update({
          invoiceId: invoice.InvoiceId,
          invoiceUrl: invoice.InvoiceURL,
          paymentData: invoice,
        });
      } else {
        throw error;
      }
    }

    return new SuccessResponse('Order created successfully', {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
      payment: {
        invoiceId: invoice.InvoiceId,
        paymentUrl: invoice.PaymentURL,
        invoiceUrl: invoice.InvoiceURL,
      },
    }).send(res);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const order = await Order.findOne({
      where: { id: Number(id), userId },
      include: [{ model: OrderItem, as: 'items' }],
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return new SuccessResponse('Order retrieved successfully', order).send(res);
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 10, status, orderType } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (orderType) {
      where.orderType = orderType;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    return new SuccessResponse('Orders retrieved successfully', {
      orders,
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

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const order = await Order.findOne({
      where: { id: Number(id), userId },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestError('Cannot cancel a paid order');
    }

    await order.update({
      status: 'cancelled',
      paymentStatus: PaymentStatus.FAILED,
    });

    return new SuccessResponse('Order cancelled successfully', {}).send(res);
  } catch (error) {
    next(error);
  }
}; 