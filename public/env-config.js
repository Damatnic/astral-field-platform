// Environment configuration for client-side
window.__ENV = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://mock:mock@localhost:5432/mock',
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || 'postgresql://mock:mock@localhost:5432/mock',
  NODE_ENV: process.env.NODE_ENV || 'development'
};