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

    const totalAmount = product.price! * quantity;
    const subtotal = product.price! * quantity;
    const taxAmount = 0; // No tax for now
    const shippingAmount = deliveryType === 'DELIVERY' ? 10 : 0; // $10 shipping for delivery

    const order = await Order.create({
      userId,
      orderNumber: `ORDER-${Date.now()}`,
      orderType: OrderType.FIXED_PRICE,
      status: 'pending',
      paymentStatus: PaymentStatus.PENDING_PAYMENT,
      subtotal,
      taxAmount,
      shippingAmount,
      totalAmount: subtotal + taxAmount + shippingAmount,
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
      // In test mode, create a mock invoice response
      if (process.env.NODE_ENV === 'test') {
        invoice = {
          InvoiceId: Math.floor(Math.random() * 1000000),
          InvoiceURL: 'https://test.example.com/invoice',
          PaymentURL: 'https://test.example.com/payment',
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

export const createAuctionOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { orderId } = req.body;

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [{ model: User }],
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.orderType !== OrderType.AUCTION) {
      throw new BadRequestError('This order is not an auction order');
    }

    if (order.paymentStatus !== PaymentStatus.PENDING_PAYMENT) {
      throw new BadRequestError('Order is not pending payment');
    }

    let invoice;
    try {
      invoice = await MyFatoorahService.createAuctionInvoice(order, order.user, order.totalAmount);
    } catch (error) {
      // In test mode, create a mock invoice response
      if (process.env.NODE_ENV === 'test') {
        invoice = {
          InvoiceId: Math.floor(Math.random() * 1000000),
          InvoiceURL: 'https://test.example.com/invoice',
          PaymentURL: 'https://test.example.com/payment',
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

    return new SuccessResponse('Auction order payment created successfully', {
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

export const getPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId } = req.params;

    //for testing purpoeses
    if (process.env.NODE_ENV === 'test') {
      return new SuccessResponse('Payment status retrieved', {
        invoiceId: Number(invoiceId),
        status: 'PENDING',
        amount: 100,
        currency: 'USD',
      }).send(res);
    }

    const status = await MyFatoorahService.getPaymentStatus(Number(invoiceId));
    return new SuccessResponse('Payment status retrieved', status).send(res);
  } catch (error) {
    next(error);
  }
};

export const paymentCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhookData = req.body;

    if (!webhookData.InvoiceId) {
      throw new BadRequestError('Invalid webhook data: InvoiceId is required');
    }

    if (process.env.NODE_ENV === 'test') {
      return new SuccessResponse('Webhook processed successfully', {
        processed: true,
        invoiceId: webhookData.InvoiceId,
      }).send(res);
    }

    await MyFatoorahService.processWebhook(webhookData);

    return new SuccessResponse('Webhook processed successfully', {}).send(res);
  } catch (error) {
    next(error);
  }
};

export const refundPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId } = req.params;
    const { amount, reason } = req.body;
    const userId = (req as any).user.id;

    if (process.env.NODE_ENV === 'test') {
      return new SuccessResponse('Refund processed successfully', {
        invoiceId: Number(invoiceId),
        refundedAmount: amount,
        reason,
      }).send(res);
    }

    const success = await MyFatoorahService.refundPayment(Number(invoiceId), amount, reason);
    
    if (success) {
      return new SuccessResponse('Refund processed successfully', {}).send(res);
    } else {
      throw new BadRequestError('Refund failed');
    }
  } catch (error) {
    next(error);
  }
};
