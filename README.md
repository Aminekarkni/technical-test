# 🏆 Auction System API

A comprehensive Node.js/TypeScript auction system with real-time bidding, payment integration, and FCM notifications.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Docker & Docker Compose
- MySQL (via Docker)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd amine-test
npm install
```

### 2. Environment Configuration
```bash
cp example.env .env
# Edit .env with your configuration
```

### 3. Start Database
```bash
npm run db:start
# or
docker-compose up -d mysql
```

### 4. Run Database Seeding
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📋 Available Scripts

### Development
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
```

### Database Management
```bash
npm run db:start     # Start MySQL database
npm run db:stop      # Stop MySQL database
npm run db:reset     # Reset database (removes all data)
```

### Seeding
```bash
npm run seed         # Run database seeding with sample data
npm run seed:direct  # Run direct seeding (alternative method)
```

### Testing
```bash
npm run test         # Run all tests (unit + e2e)
npm run test:e2e     # Run only E2E tests
npm run test:unit    # Run only unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Docker
```bash
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
npm run docker:compose   # Start all services with Docker Compose
npm run docker:compose:dev # Start development services
```

## 🗄️ Database Seeding

The seeding process creates:
- **Admin User**: `admin@milagro.com` / `admin123456`
- **Test User**: `user@milagro.com` / `user123456`
- **Categories**: Electronics, Fashion, Home & Garden, etc.
- **Sample Products**: Both fixed-price and auction items
- **Sample Auctions**: With various end times and starting prices

### Seeding Commands
```bash
# Standard seeding
npm run seed

# Direct seeding (alternative)
npm run seed:direct

# Reset database and reseed
npm run db:reset && npm run seed
```

## 🧪 E2E Testing

### Run E2E Tests Only
```bash
npm run test:e2e
```

### What E2E Tests Cover
- ✅ Complete auction flow: Login → Create Auction → Place Bid → Auction Ends → Order Created → Payment Ready
- ✅ Multiple users bidding on same auction
- ✅ Auction with no bids gracefully handled
- ✅ Authentication and authorization validation
- ✅ Login credentials validation
- ✅ Auction creation requirements validation
- ✅ Bid requirements validation
- ✅ Auction processor service with winning bid
- ✅ Auction processor service with no winning bid
- ✅ Input validation and error handling

### Test Output Example
```
✅ Complete auction flow test passed successfully!
📦 Order created: AUCTION-1753141796438-9J5ZQ6F3F
💰 Total amount: $150.00
👤 Winner: Existing User
📧 Email: existinguser@example.com
💳 Payment status: pending_payment
```

## 🔄 Complete Auction Flow

### 📊 Flow Overview Table

| Step | Action | Route | Method | Description | Authentication |
|------|--------|-------|--------|-------------|----------------|
| 1 | User Login | `/api/auth/login` | POST | Authenticate user and get JWT token | ❌ |
| 2 | Create Auction | `/api/products` | POST | Create new auction product | ✅ |
| 3 | Place Bid | `/api/bidding/bid` | POST | Place bid on auction | ✅ |
| 4 | Check Auction Status | `/api/auctions/:id/status` | GET | Get auction status and winner info | ❌ |
| 5 | Process Ended Auctions | `/api/auctions/process` | POST | Manually trigger auction processing | ✅ |
| 6 | Create Payment | `/api/payments/auction-order` | POST | Create payment for auction order | ✅ |
| 7 | Check Payment Status | `/api/payments/status/:invoiceId` | GET | Get payment status | ❌ |
| 8 | View Orders | `/api/orders` | GET | Get user's orders | ✅ |

### 🔗 Detailed API Routes

#### Authentication Routes
| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register new user | ❌ |
| `/api/auth/login` | POST | Login user | ❌ |
| `/api/auth/login/google` | POST | Google OAuth login | ❌ |
| `/api/auth/logout` | POST | Logout user | ✅ |
| `/api/auth/refresh-token` | POST | Refresh access token | ❌ |
| `/api/auth/fcm-token` | POST/DELETE | Add/remove FCM token | ✅ |

#### Product Routes
| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/products` | GET | Get all products | ❌ |
| `/api/products` | POST | Create new product/auction | ✅ |
| `/api/products/:id` | GET | Get product by ID | ❌ |
| `/api/products/:id` | PUT | Update product | ✅ |
| `/api/products/:id` | DELETE | Delete product | ✅ |
| `/api/products/:id/bids` | POST | Place bid on product | ✅ |
| `/api/products/:id/bids` | GET | Get product bids | ❌ |
| `/api/products/:id/bids/winning` | GET | Get winning bid | ❌ |
| `/api/products/:id/bids/stats` | GET | Get auction statistics | ❌ |

#### Bidding Routes
| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/bidding/bid` | POST | Place bid | ✅ |
| `/api/bidding/product/:productId` | GET | Get product bids | ✅ |
| `/api/bidding/my-bids` | GET | Get user's bids | ✅ |
| `/api/bidding/winning/:productId` | GET | Get winning bid | ✅ |
| `/api/bidding/cancel/:bidId` | DELETE | Cancel bid | ✅ |

#### Auction Routes
| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/auctions/process` | POST | Process ended auctions | ✅ |
| `/api/auctions/:auctionId/status` | GET | Get auction status | ❌ |
| `/api/auctions/:auctionId/orders` | GET | Get auction orders | ❌ |

#### Payment Routes
| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/payments/fixed-price-order` | POST | Create fixed price order payment | ✅ |
| `/api/payments/auction-order` | POST | Create auction order payment | ✅ |
| `/api/payments/status/:invoiceId` | GET | Get payment status | ❌ |
| `/api/payments/callback` | POST | Payment webhook callback | ❌ |
| `/api/payments/refund/:invoiceId` | POST | Process refund | ✅ |
| `/api/payments/mock-payment` | GET | Mock payment for testing | ❌ |

#### Order Routes
| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/orders` | POST | Create fixed price order | ✅ |
| `/api/orders` | GET | Get user's orders | ✅ |
| `/api/orders/:id` | GET | Get order by ID | ✅ |
| `/api/orders/:id` | DELETE | Cancel order | ✅ |

## 🔔 FCM Notifications

The system sends real-time notifications for:

### ✅ Implemented Notifications
- **Outbid Notifications**: When someone places a higher bid
- **Auction Won Notifications**: When auction ends and someone wins
- **Payment Success Notifications**: When payment is successful
- **Payment Failed Notifications**: When payment fails

### 📱 Notification Flow
1. User registers FCM token via `/api/auth/fcm-token`
2. System sends notifications for auction events
3. Notifications stored in database for tracking
4. Multi-device support (users can have multiple tokens)

## 🏗️ System Architecture

### Core Components
- **Express.js**: Web framework
- **Sequelize**: ORM for MySQL
- **JWT**: Authentication
- **Firebase Admin**: FCM notifications
- **MyFatoorah**: Payment gateway
- **Jest**: Testing framework
- **Docker**: Containerization

### Key Services
- **AuctionProcessorService**: Handles auction conclusion
- **BiddingService**: Manages bid placement and validation
- **FCMService**: Sends push notifications
- **MyFatoorahService**: Payment processing

## 🔧 Environment Variables

### Required Configuration
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=milagro
DB_USER=milagro_user
DB_PASSWORD=milagro_password

# JWT
ACCESS_TOKEN_VALIDITY_DAYS=7
REFRESH_TOKEN_VALIDITY_DAYS=30

# Firebase (for FCM)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# MyFatoorah (Payment)
MY_FATOORAH_TOKEN=your-token
MY_FATOORAH_BASEURL=https://apitest.myfatoorah.com
```

## 🐳 Docker Setup

### Development with Docker
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View development logs
docker-compose -f docker-compose.dev.yml logs -f
```

## 📊 API Documentation

### Swagger UI
Once the server is running, visit:
```
http://localhost:3000/api-docs
```

### Health Check
```
GET http://localhost:3000/health
```

## 🧪 Testing Strategy

### Test Types
- **E2E Tests**: Complete flow testing

### Test Database
- Separate test database 
- Automatic cleanup between tests
- Isolated test environment

### Running Tests
```bash
# All tests
npm run test

# E2E only
npm run test:e2e

# Unit only
npm run test:unit

# With coverage
npm run test:coverage
```

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Docker Production
```bash
docker build -t auction-system .
docker run -p 3000:3000 auction-system
```

## 📝 API Examples

### Complete Auction Flow Example

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@milagro.com", "password": "user123456"}'

# 2. Create Auction
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Auction",
    "description": "Test auction description",
    "type": "auction",
    "startingPrice": 100,
    "auctionEndTime": "2024-01-01T00:00:00.000Z",
    "images": ["https://example.com/image.jpg"],
    "coverImage": "https://example.com/cover.jpg",
    "categoryId": 1
  }'

# 3. Place Bid
curl -X POST http://localhost:3000/api/bidding/bid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "bidAmount": 150,
    "note": "My bid"
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

---

**🎉 Happy Bidding!** The auction system is now ready for production use with comprehensive testing, real-time notifications, and payment integration.
