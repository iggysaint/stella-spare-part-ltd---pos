import { ShopSettings } from '../types';
import { storage, DEFAULT_SETTINGS } from './storage';

export const settingsService = {
  async getSettings(): Promise<ShopSettings> {
    return storage.getSettings();
  },

  async saveSettings(settings: ShopSettings): Promise<ShopSettings> {
    storage.saveSettings(settings);
    return settings;
  },

  getDefaultSettings(): ShopSettings {
    return { ...DEFAULT_SETTINGS };
  },
};
