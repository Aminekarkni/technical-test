import axios from 'axios';
import crypto from 'crypto';
import { myFatoorahSettings } from '../../configVars';
import Order, { PaymentStatus, OrderType } from '../../database/models/Order';
import User from '../../database/models/User';
import FCMService from '../notification/fcm.service';
import Logger from '../../core/Logger';
import { BadRequestError, InternalError } from '../../core/ApiError';

export interface MyFatoorahInvoice {
  InvoiceId: number;
  InvoiceURL: string;
  PaymentURL: string;
  PaymentId: string;
  IsDirectPayment: boolean;
  PaymentMethods: any[];
}

export interface MyFatoorahPaymentData {
  InvoiceId: number;
  InvoiceURL: string;
  PaymentURL: string;
  PaymentId: string;
  IsDirectPayment: boolean;
  PaymentMethods: any[];
  ErrorCode?: string;
  ErrorMessage?: string;
}

export interface MyFatoorahWebhookData {
  InvoiceId: number;
  PaymentId: string;
  PaymentStatus: 'PAID' | 'FAILED' | 'PENDING';
  TransactionId: string;
  TransactionDate: string;
  PaymentMethod: string;
  Amount: number;
  Currency: string;
  ErrorCode?: string;
  ErrorMessage?: string;
}

export class MyFatoorahService {
  private static readonly baseURL = myFatoorahSettings.baseUrl;
  private static readonly token = myFatoorahSettings.token;

  
  static async createFixedPriceInvoice(
    order: Order,
    user: User
  ): Promise<MyFatoorahInvoice> {
    try {
      const url = `${this.baseURL}/v2/SendPayment`;
      
      const payload = {
        InvoiceAmount: order.totalAmount,
        CurrencyIso: 'USD',
        CustomerName: `${user.firstName} ${user.lastName}`,
        CustomerEmail: user.email,
        CustomerMobile: user.phoneNumber,
        CustomerReference: order.id.toString(),
        CustomerCivilId: '',
        CustomerAddress: {
          Block: '',
          Street: '',
          HouseBuildingNo: '',
          Address: '',
          AddressInstructions: '',
        },
        CustomerNationality: '',
        CustomerReferenceId: '',
        UserDefinedField: '',
        SendInvoiceOption: 1,
        NotificationOption: 1,
        InvoiceItems: [
          {
            ItemName: `Order #${order.orderNumber}`,
            Quantity: 1,
            UnitPrice: order.totalAmount,
          },
        ],
        CallBackUrl: `${process.env.BASE_URL}/api/payments/callback`,
        ErrorUrl: `${process.env.BASE_URL}/api/payments/error`,
        Language: 'EN',
        ExpireDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.IsSuccess) {
        const invoiceData = response.data.Data;
        
        await order.update({
          invoiceId: invoiceData.InvoiceId,
          invoiceUrl: invoiceData.InvoiceURL,
          paymentData: invoiceData,
        });

        return {
          InvoiceId: invoiceData.InvoiceId,
          InvoiceURL: invoiceData.InvoiceURL,
          PaymentURL: invoiceData.PaymentURL,
          PaymentId: invoiceData.PaymentId,
          IsDirectPayment: invoiceData.IsDirectPayment,
          PaymentMethods: invoiceData.PaymentMethods,
        };
      } else {
        throw new BadRequestError(response.data.ErrorMessage || 'Failed to create invoice');
      }
    } catch (error) {
      Logger.error('Error creating MyFatoorah invoice:', error);
      throw new InternalError('Payment initialization failed');
    }
  }

  
  static async createAuctionInvoice(
    order: Order,
    user: User,
    winningBid: number
  ): Promise<MyFatoorahInvoice> {
    try {
      const url = `${this.baseURL}/v2/SendPayment`;
      
      const payload = {
        InvoiceAmount: winningBid,
        CurrencyIso: 'USD',
        CustomerName: `${user.firstName} ${user.lastName}`,
        CustomerEmail: user.email,
        CustomerMobile: user.phoneNumber,
        CustomerReference: order.id.toString(),
        CustomerCivilId: '',
        CustomerAddress: {
          Block: '',
          Street: '',
          HouseBuildingNo: '',
          Address: '',
          AddressInstructions: '',
        },
        CustomerNationality: '',
        CustomerReferenceId: '',
        UserDefinedField: '',
        SendInvoiceOption: 1,
        NotificationOption: 1,
        InvoiceItems: [
          {
            ItemName: `Auction Win - Order #${order.orderNumber}`,
            Quantity: 1,
            UnitPrice: winningBid,
          },
        ],
        CallBackUrl: `${process.env.BASE_URL}/api/payments/error`,
        ErrorUrl: `${process.env.BASE_URL}/api/payments/error`,
        Language: 'EN',
        ExpireDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.IsSuccess) {
        const invoiceData = response.data.Data;
        
        await order.update({
          invoiceId: invoiceData.InvoiceId,
          invoiceUrl: invoiceData.InvoiceURL,
          paymentData: invoiceData,
        });

        return {
          InvoiceId: invoiceData.InvoiceId,
          InvoiceURL: invoiceData.InvoiceURL,
          PaymentURL: invoiceData.PaymentURL,
          PaymentId: invoiceData.PaymentId,
          IsDirectPayment: invoiceData.IsDirectPayment,
          PaymentMethods: invoiceData.PaymentMethods,
        };
      } else {
        throw new BadRequestError(response.data.ErrorMessage || 'Failed to create invoice');
      }
    } catch (error) {
      Logger.error('Error creating MyFatoorah auction invoice:', error);
      throw new InternalError('Payment initialization failed');
    }
  }

  
  static async getPaymentStatus(invoiceId: number): Promise<MyFatoorahWebhookData> {
    try {
      const url = `${this.baseURL}/v2/getPaymentStatus`;
      
      const payload = {
        Key: invoiceId,
        KeyType: 'invoiceid',
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.IsSuccess) {
        return response.data.Data;
      } else {
        throw new BadRequestError(response.data.ErrorMessage || 'Failed to get payment status');
      }
    } catch (error) {
      Logger.error('Error getting payment status:', error);
      throw new InternalError('Failed to get payment status');
    }
  }

  
  static async processWebhook(webhookData: MyFatoorahWebhookData): Promise<void> {
    try {
      const { InvoiceId, PaymentStatus, PaymentId, TransactionId, TransactionDate, PaymentMethod, Amount, Currency } = webhookData;

      if (!InvoiceId) {
        Logger.error('Invalid webhook data: InvoiceId is required');
        return;
      }

      const order = await Order.findOne({
        where: { invoiceId: InvoiceId },
        include: [{ model: User }],
      });

      if (!order) {
        Logger.error(`Order not found for invoice ID: ${InvoiceId}`);
        return;
      }

      const user = order.user;
      if (!user) {
        Logger.error(`User not found for order: ${order.id}`);
        return;
      }

      if (PaymentStatus === 'PAID') {
        await order.update({
          paymentStatus: 'paid',
          paymentId: PaymentId,
          paymentMethod: PaymentMethod,
          paymentData: {
            transactionId: TransactionId,
            transactionDate: TransactionDate,
            amount: Amount,
            currency: Currency,
          },
        });

        await FCMService.sendPaymentSuccessNotification(
          user.id,
          order.id,
          Amount
        );

        Logger.info(`Payment processed successfully for order ${order.id}`);
      } else if (PaymentStatus === 'FAILED') {
        await order.update({
          paymentStatus: 'failed',
          paymentData: {
            transactionId: TransactionId,
            transactionDate: TransactionDate,
            amount: Amount,
            currency: Currency,
            error: 'Payment failed',
          },
        });

        await FCMService.sendPaymentFailedNotification(
          user.id,
          order.id,
          Amount
        );

        Logger.info(`Payment failed for order ${order.id}`);
      }
    } catch (error) {
      Logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secretKey: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      Logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  
  static async refundPayment(
    invoiceId: number,
    amount: number,
    reason: string
  ): Promise<boolean> {
    try {
      const url = `${this.baseURL}/v2/MakeRefund`;
      
      const payload = {
        Key: invoiceId,
        KeyType: 'invoiceid',
        Amount: amount,
        Reason: reason,
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.IsSuccess) {
        Logger.info(`Refund processed for invoice ${invoiceId}: ${amount}`);
        return true;
      } else {
        Logger.error(`Refund failed for invoice ${invoiceId}: ${response.data.ErrorMessage}`);
        return false;
      }
    } catch (error) {
      Logger.error('Error processing refund:', error);
      return false;
    }
  }
}

export default MyFatoorahService; 