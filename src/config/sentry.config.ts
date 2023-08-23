import { registerAs } from '@nestjs/config';

export default registerAs('sentry', () => {
  return {
    dsn: process.env.SENTRY_DSN,
  };
});
