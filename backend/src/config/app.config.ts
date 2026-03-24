export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  database: {
    path: process.env.DATABASE_PATH || './data/diary.sqlite',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  session: {
    secret: process.env.SESSION_SECRET || 'change-me',
    expiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS || '72', 10),
  },
  pin: {
    saltRounds: parseInt(process.env.PIN_SALT_ROUNDS || '12', 10),
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    pinTtl: parseInt(process.env.RATE_LIMIT_PIN_TTL || '60', 10),
    pinMax: parseInt(process.env.RATE_LIMIT_PIN_MAX || '5', 10),
  },
});
