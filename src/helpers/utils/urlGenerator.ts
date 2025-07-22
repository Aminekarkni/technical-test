import { baseUrl } from '../../configVars';

export class UrlGenerator {
  static getBaseUrl(): string {
    return baseUrl || 'http://localhost:3000';
  }

  static getOrderInvoiceUrl(orderId: string | number): string {
    return `${this.getBaseUrl()}/api/orders/${orderId}/invoice`;
  }

  static getMockPaymentUrl(orderId: string | number): string {
    return `${this.getBaseUrl()}/api/payments/mock-payment?orderId=${orderId}`;
  }

  static getProductUrl(productId: string | number): string {
    return `${this.getBaseUrl()}/api/products/${productId}`;
  }

  static getOrderUrl(orderId: string | number): string {
    return `${this.getBaseUrl()}/api/orders/${orderId}`;
  }

  static getPaymentStatusUrl(invoiceId: string | number): string {
    return `${this.getBaseUrl()}/api/payments/status/${invoiceId}`;
  }

  static getRefundUrl(invoiceId: string | number): string {
    return `${this.getBaseUrl()}/api/payments/refund/${invoiceId}`;
  }
} 