const Redis = require('ioredis');

class RedisService {
  constructor() {
    this.client = null;
    if (process.env.REDIS_URL) {
      this.client = new Redis(process.env.REDIS_URL);
      this.client.on('error', (err) => console.error('Redis Client Error', err));
      this.client.on('connect', () => console.log('Redis Client Connected'));
    }
  }

  async get(key) {
    if (!this.client) return null;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key, value, expiry = 3600) {
    if (!this.client) return;
    await this.client.set(key, JSON.stringify(value), 'EX', expiry);
  }

  async del(key) {
    if (!this.client) return;
    await this.client.del(key);
  }

  async flush() {
    if (!this.client) return;
    await this.client.flushall();
  }
}

module.exports = new RedisService();
