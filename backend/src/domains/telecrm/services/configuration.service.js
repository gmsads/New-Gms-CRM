const TeleConfig = require('../models/teleConfig.model');

let configCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60000; // 1 min cache

class ConfigurationService {
  async getConfig() {
    const now = Date.now();
    if (configCache && (now - lastCacheTime < CACHE_TTL_MS)) {
      return configCache;
    }

    let config = await TeleConfig.findOne({ key: 'ENTERPRISE_DEFAULT' }).lean();
    if (!config) {
      config = await TeleConfig.create({ key: 'ENTERPRISE_DEFAULT' });
      config = config.toObject();
    }
    configCache = config;
    lastCacheTime = now;
    return config;
  }

  async updateConfig(updateData, userId) {
    const updated = await TeleConfig.findOneAndUpdate(
      { key: 'ENTERPRISE_DEFAULT' },
      { $set: { ...updateData, updatedBy: userId } },
      { new: true, upsert: true }
    ).lean();

    configCache = updated;
    lastCacheTime = Date.now();
    return updated;
  }

  async isWorkingHour() {
    const cfg = await this.getConfig();
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = days[now.getDay()];

    if (!cfg?.workingHours?.workDays?.includes(currentDay)) return false;

    const [startH, startM] = (cfg?.workingHours?.startHour || '09:00').split(':').map(Number);
    const [endH, endM] = (cfg?.workingHours?.endHour || '18:30').split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
}

module.exports = new ConfigurationService();
