import firebase from 'firebase-admin';
import { NotificationConfig } from '../../configVars';
import Notification, { NotificationType, NotificationStatus } from '../../database/models/Notification';
import User from '../../database/models/User';
import Logger from '../../core/Logger';

let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;
  
  if (process.env.NODE_ENV === 'test') {
    firebaseInitialized = true;
    return;
  }

  if (!NotificationConfig.project_id || !NotificationConfig.client_email || !NotificationConfig.private_key) {
    Logger.warn('Firebase configuration missing, FCM notifications will be disabled');
    firebaseInitialized = true;
    return;
  }

  try {
    firebase.initializeApp({
      credential: firebase.credential.cert({
        projectId: NotificationConfig.project_id,
        clientEmail: NotificationConfig.client_email,
        privateKey: NotificationConfig.private_key.trim().replace(/\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    Logger.info('Firebase initialized successfully');
  } catch (error) {
    Logger.error('Failed to initialize Firebase:', error);
    firebaseInitialized = true;
  }
}

export interface NotificationData {
  title: string;
  body: string;
  type: NotificationType;
  data?: {
    orderId?: string;
    productId?: string;
    paymentId?: string;
    redirectUrl?: string;
    [key: string]: any;
  };
}

export interface FCMNotificationPayload {
  notification: {
    title: string;
    body: string;
    image?: string;
  };
  data?: {
    [key: string]: string;
  };
  android?: {
    notification: {
      sound: string;
      priority: 'max' | 'default' | 'high' | 'low' | 'min';
    };
  };
  apns?: {
    payload: {
      aps: {
        sound: string;
        badge: number;
      };
    };
  };
}

export class FCMService {
  static async sendToUser(
    userId: number,
    notificationData: NotificationData
  ): Promise<boolean> {
    try {
      initializeFirebase();
      
      const user = await User.findByPk(userId);
      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        Logger.warn(`No FCM tokens found for user ${userId}`);
        return false;
      }

      const notification = await Notification.create({
        userId,
        title: notificationData.title,
        body: notificationData.body,
        type: notificationData.type,
        data: notificationData.data || {},
        status: NotificationStatus.PENDING,
      });

      const results = await Promise.allSettled(
        user.fcmTokens.map(token => this.sendToToken(token, notificationData))
      );

      const successCount = results.filter(
        (result: any) => result.status === 'fulfilled' && result.value
      ).length;

      await notification.update({
        status: successCount > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED,
        sentAt: new Date(),
        fcmMessageId: successCount > 0 ? 'sent' : null,
        errorMessage: successCount === 0 ? 'Failed to send to any device' : null,
      });

      Logger.info(`Sent notification to user ${userId}: ${successCount}/${user.fcmTokens.length} devices`);
      return successCount > 0;
    } catch (error) {
      Logger.error('Error sending notification to user:', error);
      return false;
    }
  }

  static async sendToUsers(
    userIds: number[],
    notificationData: NotificationData
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendToUser(userId, notificationData))
    );

    const success = results.filter(
      (result: any) => result.status === 'fulfilled' && result.value
    ).length;
    const failed = results.length - success;

    return { success, failed };
  }

  static async sendToToken(
    token: string,
    notificationData: NotificationData
  ): Promise<boolean> {
    try {
      initializeFirebase();
      
      const payload: FCMNotificationPayload = {
        notification: {
          title: notificationData.title,
          body: notificationData.body,
        },
        data: {
          type: notificationData.type,
          ...(notificationData.data && Object.fromEntries(
            Object.entries(notificationData.data).map(([key, value]) => [key, String(value)])
          )),
        },
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await firebase.messaging().send({
        token,
        ...payload,
      });

      Logger.info(`FCM message sent successfully: ${response}`);
      return true;
    } catch (error) {
      Logger.error('Error sending FCM message:', error);
      return false;
    }
  }

  static async sendOutbidNotification(
    userId: number,
    productId: number,
    productName: string,
    newBidAmount: number
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      title: 'You have been outbid!',
      body: `Someone has placed a higher bid on ${productName}. Current highest bid: $${newBidAmount}`,
      type: NotificationType.ORDER_STATUS,
      data: {
        productId: productId.toString(),
        newBidAmount: newBidAmount.toString(),
      },
    });
  }

  static async sendAuctionWonNotification(
    userId: number,
    productId: number,
    productName: string,
    winningBid: number
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      title: 'Congratulations! You won the auction!',
      body: `You won the auction for ${productName} with a bid of $${winningBid}. Please complete your payment.`,
      type: NotificationType.ORDER_STATUS,
      data: {
        productId: productId.toString(),
        winningBid: winningBid.toString(),
      },
    });
  }

  static async sendPaymentSuccessNotification(
    userId: number ,
    orderId: number,
    amount: number
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      title: 'Payment Successful!',
      body: `Your payment of $${amount} has been processed successfully. Order #${orderId}`,
      type: NotificationType.PAYMENT,
      data: {
        orderId: orderId.toString(),
        amount: amount.toString(),
      },
    });
  }

  static async sendPaymentFailedNotification(
    userId: number,
    orderId: number,
    amount: number
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      title: 'Payment Failed',
      body: `Your payment of $${amount} for order #${orderId} has failed. Please try again.`,
      type: NotificationType.PAYMENT,
      data: {
        orderId: orderId.toString(),
        amount: amount.toString(),
      },
    });
  }

  static async sendOrderStatusNotification(
    userId: number,
    orderId: number,
    status: string
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      title: 'Order Status Updated',
      body: `Your order #${orderId} status has been updated to: ${status}`,
      type: NotificationType.ORDER_STATUS,
      data: {
        orderId: orderId.toString(),
        status,
      },
    });
  }

  
  static async sendPromotionalNotification(
    userId: number,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      title,
      body,
      type: NotificationType.PROMOTION,
      data,
    });
  }
}

export default FCMService; 