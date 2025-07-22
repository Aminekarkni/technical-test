import { MyFatoorahService, MyFatoorahInvoice, MyFatoorahWebhookData } from '../services/payment/myfatoorah.service';
import Order, { OrderType, PaymentStatus } from '../database/models/Order';
import User from '../database/models/User';
import { FCMService } from '../services/notification/fcm.service';
import { BadRequestError, InternalError, NotFoundError } from '../core/ApiError';
import axios from 'axios';
import crypto from 'crypto';

// Mock dependencies
jest.mock('../database/models/Order');
jest.mock('../database/models/User');
jest.mock('../services/notification/fcm.service');
jest.mock('axios');
jest.mock('crypto');

const mockOrder = Order as jest.Mocked<typeof Order>;
const mockUser = User as jest.Mocked<typeof User>;
const mockFCMService = FCMService as jest.Mocked<typeof FCMService>;
const mockAxios = axios as jest.Mocked<typeof axios>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('MyFatoorahService Unit Tests', () => {
  let testUser: any;
  let testOrder: any;
  let testInvoice: any;

  beforeEach(() => {
    jest.clearAllMocks();

    testUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '1234567890',
    };

    testOrder = {
      id: 1,
      orderNumber: 'ORD-12345',
      userId: testUser.id,
      totalAmount: '200.00',
      status: 'pending',
      paymentStatus: 'pending_payment',
      orderType: OrderType.FIXED_PRICE,
      note: 'Test order',
      update: jest.fn().mockResolvedValue(testOrder),
    };

    testInvoice = {
      InvoiceId: 12345,
      InvoiceURL: 'https://example.com/invoice',
      PaymentURL: 'https://example.com/payment',
      PaymentId: 'payment-123',
      IsDirectPayment: false,
      PaymentMethods: [],
    };
  });

  describe('createFixedPriceInvoice', () => {
    it('should create fixed price invoice successfully', async () => {
      const mockResponse = {
        data: {
          IsSuccess: true,
          Data: testInvoice,
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await MyFatoorahService.createFixedPriceInvoice(testOrder, testUser);

      expect(result).toEqual(testInvoice);
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v2/SendPayment'),
        expect.objectContaining({
          InvoiceAmount: testOrder.totalAmount,
          CurrencyIso: 'USD',
          CustomerName: `${testUser.firstName} ${testUser.lastName}`,
          CustomerEmail: testUser.email,
          CustomerMobile: testUser.phoneNumber,
          CustomerReference: testOrder.id.toString(),
        }),
        expect.objectContaining({
          headers: {
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          },
        })
      );

      expect(testOrder.update).toHaveBeenCalledWith({
        invoiceId: testInvoice.InvoiceId,
        invoiceUrl: testInvoice.InvoiceURL,
        paymentUrl: testInvoice.PaymentURL,
      });
    });

    it('should handle API error response', async () => {
      const mockResponse = {
        data: {
          IsSuccess: false,
          Message: 'Invalid amount',
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      await expect(MyFatoorahService.createFixedPriceInvoice(testOrder, testUser)).rejects.toThrow(
        InternalError
      );
    });

    it('should handle network error', async () => {
      mockAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(MyFatoorahService.createFixedPriceInvoice(testOrder, testUser)).rejects.toThrow(
        InternalError
      );
    });
  });

  describe('createAuctionInvoice', () => {
    it('should create auction invoice successfully', async () => {
      const winningBid = 250;
      const mockResponse = {
        data: {
          IsSuccess: true,
          Data: testInvoice,
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await MyFatoorahService.createAuctionInvoice(testOrder, testUser, winningBid);

      expect(result).toEqual(testInvoice);
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v2/SendPayment'),
        expect.objectContaining({
          InvoiceAmount: winningBid.toString(),
          InvoiceItems: [
            {
              ItemName: `Auction Order #${testOrder.orderNumber}`,
              Quantity: 1,
              UnitPrice: winningBid.toString(),
            },
          ],
        }),
        expect.any(Object)
      );
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status successfully', async () => {
      const invoiceId = 12345;
      const mockWebhookData: MyFatoorahWebhookData = {
        InvoiceId: invoiceId,
        PaymentId: 'payment-123',
        PaymentStatus: 'PAID',
        TransactionId: 'txn-123',
        TransactionDate: '2024-01-01T12:00:00Z',
        PaymentMethod: 'VISA',
        Amount: 200,
        Currency: 'USD',
      };

      const mockResponse = {
        data: {
          IsSuccess: true,
          Data: mockWebhookData,
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await MyFatoorahService.getPaymentStatus(invoiceId);

      expect(result).toEqual(mockWebhookData);
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v2/GetPaymentStatus'),
        { InvoiceId: invoiceId },
        expect.objectContaining({
          headers: {
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle API error response', async () => {
      const invoiceId = 12345;
      const mockResponse = {
        data: {
          IsSuccess: false,
          Message: 'Invoice not found',
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      await expect(MyFatoorahService.getPaymentStatus(invoiceId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('processWebhook', () => {
    it('should process successful payment webhook', async () => {
      const webhookData: MyFatoorahWebhookData = {
        InvoiceId: 12345,
        PaymentId: 'payment-123',
        PaymentStatus: 'PAID',
        TransactionId: 'txn-123',
        TransactionDate: '2024-01-01T12:00:00Z',
        PaymentMethod: 'VISA',
        Amount: 200,
        Currency: 'USD',
      };

      mockOrder.findOne.mockResolvedValue(testOrder);
      mockUser.findByPk.mockResolvedValue(testUser);
      mockFCMService.sendPaymentSuccessNotification.mockResolvedValue(true);

      await MyFatoorahService.processWebhook(webhookData);

      expect(Order.findOne).toHaveBeenCalledWith({
        where: { invoiceId: webhookData.InvoiceId },
        include: [{ model: User }],
      });

      expect(testOrder.update).toHaveBeenCalledWith({
        paymentStatus: PaymentStatus.PAID,
        paymentId: webhookData.PaymentId,
        transactionId: webhookData.TransactionId,
        paidAt: expect.any(Date),
      });

      expect(mockFCMService.sendPaymentSuccessNotification).toHaveBeenCalledWith(
        testUser.id,
        testOrder.id,
        webhookData.Amount
      );
    });

    it('should process failed payment webhook', async () => {
      const webhookData: MyFatoorahWebhookData = {
        InvoiceId: 12345,
        PaymentId: 'payment-123',
        PaymentStatus: 'FAILED',
        TransactionId: 'txn-123',
        TransactionDate: '2024-01-01T12:00:00Z',
        PaymentMethod: 'VISA',
        Amount: 200,
        Currency: 'USD',
        ErrorCode: 'CARD_DECLINED',
        ErrorMessage: 'Card was declined',
      };

      mockOrder.findOne.mockResolvedValue(testOrder);
      mockUser.findByPk.mockResolvedValue(testUser);
      mockFCMService.sendPaymentFailedNotification.mockResolvedValue(true);

      await MyFatoorahService.processWebhook(webhookData);

      expect(testOrder.update).toHaveBeenCalledWith({
        paymentStatus: PaymentStatus.FAILED,
        paymentId: webhookData.PaymentId,
        transactionId: webhookData.TransactionId,
        paidAt: null,
      });

      expect(mockFCMService.sendPaymentFailedNotification).toHaveBeenCalledWith(
        testUser.id,
        testOrder.id,
        webhookData.Amount
      );
    });

    it('should handle order not found', async () => {
      const webhookData: MyFatoorahWebhookData = {
        InvoiceId: 99999,
        PaymentId: 'payment-123',
        PaymentStatus: 'PAID',
        TransactionId: 'txn-123',
        TransactionDate: '2024-01-01T12:00:00Z',
        PaymentMethod: 'VISA',
        Amount: 200,
        Currency: 'USD',
      };

      mockOrder.findOne.mockResolvedValue(null);

      await expect(MyFatoorahService.processWebhook(webhookData)).rejects.toThrow(NotFoundError);
    });

    it('should handle invalid payment status', async () => {
      const webhookData: MyFatoorahWebhookData = {
        InvoiceId: 12345,
        PaymentId: 'payment-123',
        PaymentStatus: 'INVALID_STATUS' as any,
        TransactionId: 'txn-123',
        TransactionDate: '2024-01-01T12:00:00Z',
        PaymentMethod: 'VISA',
        Amount: 200,
        Currency: 'USD',
      };

      mockOrder.findOne.mockResolvedValue(testOrder);

      await expect(MyFatoorahService.processWebhook(webhookData)).rejects.toThrow(BadRequestError);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = 'test-payload';
      const signature = 'valid-signature';
      const secretKey = 'test-secret';

      const expectedHash = 'expected-hash';
      mockCrypto.createHmac.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(expectedHash),
      } as any);

      const result = MyFatoorahService.verifyWebhookSignature(payload, signature, secretKey);

      expect(result).toBe(true);
      expect(mockCrypto.createHmac).toHaveBeenCalledWith('sha256', secretKey);
    });

    it('should reject invalid webhook signature', () => {
      const payload = 'test-payload';
      const signature = 'invalid-signature';
      const secretKey = 'test-secret';

      const expectedHash = 'expected-hash';
      mockCrypto.createHmac.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(expectedHash),
      } as any);

      const result = MyFatoorahService.verifyWebhookSignature(payload, signature, secretKey);

      expect(result).toBe(false);
    });
  });

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      const invoiceId = 12345;
      const amount = 100;
      const reason = 'Customer request';

      const mockResponse = {
        data: {
          IsSuccess: true,
          Data: {
            RefundId: 'refund-123',
            Amount: amount,
            Reason: reason,
          },
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await MyFatoorahService.refundPayment(invoiceId, amount, reason);

      expect(result).toBe(true);
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v2/MakeRefund'),
        expect.objectContaining({
          InvoiceId: invoiceId,
          Amount: amount,
          Reason: reason,
        }),
        expect.objectContaining({
          headers: {
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle refund failure', async () => {
      const invoiceId = 12345;
      const amount = 100;
      const reason = 'Customer request';

      const mockResponse = {
        data: {
          IsSuccess: false,
          Message: 'Refund failed',
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await MyFatoorahService.refundPayment(invoiceId, amount, reason);

      expect(result).toBe(false);
    });

    it('should handle network error during refund', async () => {
      const invoiceId = 12345;
      const amount = 100;
      const reason = 'Customer request';

      mockAxios.post.mockRejectedValue(new Error('Network error'));

      const result = await MyFatoorahService.refundPayment(invoiceId, amount, reason);

      expect(result).toBe(false);
    });
  });
}); 