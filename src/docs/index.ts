import swaggerJsDoc from 'swagger-jsdoc';
import { baseUrl } from '../configVars';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Milagro E-commerce API',
      version: '1.0.0',
      description: `
        Complete API documentation for the Milagro e-commerce platform.
        
        ## Features
        - User authentication and authorization
        - Product management (fixed-price and auction)
        - Bidding system
        - Order management
        - Payment processing with MyFatoorah
        - Auction processing and winner determination
        
        ## Authentication
        Most endpoints require authentication using Bearer tokens.
        Include the token in the Authorization header: \`Authorization: Bearer <token>\`
      `,
    },
    servers: [
      {
        url: `${baseUrl}/api`,
        description: 'Development server',
      },
      {
        url: 'https://api.milagro.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phoneNumber: { type: 'string', example: '+1234567890' },
            avatar: { type: 'string', example: 'public/avatar-default-icon.png' },
            verified: { type: 'boolean', example: true },
            emailIsVerified: { type: 'boolean', example: true },
            roles: {
              type: 'array',
              items: { $ref: '#/components/schemas/Role' },
            },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'user' },
            code: { type: 'string', example: 'USER' },
            description: { type: 'string', example: 'Regular user role' },
            isActive: { type: 'boolean', example: true },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'iPhone 15 Pro' },
            description: { type: 'string', example: 'Latest iPhone with advanced features' },
            type: { type: 'string', enum: ['fixed_price', 'auction'], example: 'auction' },
            price: { type: 'number', format: 'float', example: 999.99 },
            startingPrice: { type: 'number', format: 'float', example: 500.00 },
            currentHighestBid: { type: 'number', format: 'float', example: 750.00 },
            auctionEndTime: { type: 'string', format: 'date-time', example: '2025-07-25T10:00:00Z' },
            images: {
              type: 'array',
              items: { type: 'string' },
              example: ['image1.jpg', 'image2.jpg'],
            },
            coverImage: { type: 'string', example: 'cover.jpg' },
            categoryId: { type: 'integer', example: 1 },
            isActive: { type: 'boolean', example: true },
          },
        },
        Bid: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            productId: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            bidAmount: { type: 'number', format: 'float', example: 750.00 },
            note: { type: 'string', example: 'I really want this item!' },
            isWinningBid: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time', example: '2025-07-21T10:00:00Z' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            orderNumber: { type: 'string', example: 'ORDER-123456789' },
            userId: { type: 'integer', example: 1 },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
              example: 'pending',
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending_payment', 'paid', 'refunded'],
              example: 'pending_payment',
            },
            orderType: {
              type: 'string',
              enum: ['fixed_price', 'auction'],
              example: 'auction',
            },
            subtotal: { type: 'number', format: 'float', example: 750.00 },
            taxAmount: { type: 'number', format: 'float', example: 0.00 },
            shippingAmount: { type: 'number', format: 'float', example: 0.00 },
            totalAmount: { type: 'number', format: 'float', example: 750.00 },
            note: { type: 'string', example: 'Auction winner for: iPhone 15 Pro' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-07-21T10:00:00Z' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            invoiceId: { type: 'string', example: '123456789' },
            paymentUrl: { type: 'string', example: 'https://payment.gateway.com/pay/123456789' },
            paymentMethods: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  paymentMethodId: { type: 'integer', example: 1 },
                  paymentMethodEn: { type: 'string', example: 'Credit Card' },
                  paymentMethodAr: { type: 'string', example: 'بطاقة ائتمان' },
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Invalid credentials' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Email is required' },
                },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
      },
    },
  },
  apis: [
    './src/docs/**/*.ts',
    './src/docs/*.ts',
  ],
  swaggerOptions: {
    docExpansion: 'none',
  },
};

export const specs = swaggerJsDoc(options);
