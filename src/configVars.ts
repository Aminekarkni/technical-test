import dotenv from 'dotenv';

dotenv.config();

export const environment = process.env.NODE_ENV || 'development';
export const port = process.env.PORT || '';
export const baseUrl = process.env.BASE_URL || '';

export const db = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  name: process.env.DB_NAME || 'milagro',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dialect: process.env.DB_DIALECT || 'mysql',
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '5'),
    min: parseInt(process.env.DB_POOL_MIN || '0'),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
  },
};

export const corsUrl = process.env.CORS_URL || 'http://localhost:3000';

export const tokenInfo = {
  accessTokenValidityDays: parseInt(
    process.env.ACCESS_TOKEN_VALIDITY_DAYS || '0'
  ),
  refreshTokenValidityDays: parseInt(
    process.env.REFRESH_TOKEN_VALIDITY_DAYS || '0'
  ),
  issuer: process.env.TOKEN_ISSUER || '',
  audience: process.env.TOKEN_AUDIENCE || '',
};

export const logDirectory = process.env.LOG_DIR || '';

export const adminSeeder = {
  adminFirstName: process.env.ADMIN_FIRST_NAME || '',
  adminLastName: process.env.ADMIN_LAST_NAME || '',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPass: process.env.ADMIN_PASS || '',
  adminPhone: process.env.ADMIN_PHONE || '',
};

export const userSeeder = {
  userFirstName: process.env.USER_FIRST_NAME || '',
  userLastName: process.env.USER_LAST_NAME || '',
  userEmail: process.env.USER_EMAIL || '',
  userPass: process.env.USER_PASS || '',
  userPhone: process.env.USER_PHONE || '',
};

export const email = {
  smtpService: process.env.SMTP_SERVICE || '',
  smtpHost: process.env.EMAIL_HOST || '',
  smtpPort: process.env.EMAIL_PORT || '',
  smtpUser: process.env.EMAIL_USERNAME || '',
  smtpPass: process.env.EMAIL_PASSWORD || '',
};

export const phoneProvider = {
  url: process.env.SMS_URL,
  key: process.env.SMS_KEY,
  sender: process.env.SMS_SENDER,
  fct: process.env.SMS_FUNCTION,
};

export const NotificationConfig = {
  client_email: process.env.CLIENT_EMAIL,
  private_key: process.env.PRIVATE_KEY,
  project_id: process.env.PROJECT_ID,
};

export const twilioSettings = {
  accountSid: process.env.ACCOUNT_SID,
  authToken: process.env.AUTH_TOKEN,
  verifySid: process.env.VERIFY_SERVICE_SID,
  phoneNumber: process.env.PHONE_NUMBER,
};

export const myFatoorahSettings = {
  token: process.env.MY_FATOORAH_TOKEN,
  baseUrl: process.env.MY_FATOORAH_BASEURL,
};

export const authProviders = {
  googleClientId: process.env.GOOGLE_CLIENT_ID,
};
