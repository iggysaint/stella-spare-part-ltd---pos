import { ShopSettings } from '../types';
import { supabase } from './supabaseClient';

const DEFAULT_SETTINGS: ShopSettings = {
  shop_name: 'Stella Spare Part Ltd',
  phone_number: '0595259640',
  address: 'Tema Station, Accra',
  receipt_footer: 'Thank you!',
  receipt_paper_size: '80mm',
  currency_symbol: 'GH₵',
};

export const settingsService = {
  async getSettings(): Promise<ShopSettings> {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('id', true)
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return { ...DEFAULT_SETTINGS };
    }

    if (!data) {
      return { ...DEFAULT_SETTINGS };
    }

    return {
      shop_name: data.shop_name || DEFAULT_SETTINGS.shop_name,
      phone_number: data.phone_number || DEFAULT_SETTINGS.phone_number,
      address: data.address || DEFAULT_SETTINGS.address,
      receipt_footer: data.receipt_footer || DEFAULT_SETTINGS.receipt_footer,
      receipt_paper_size: data.receipt_paper_size || DEFAULT_SETTINGS.receipt_paper_size,
      currency_symbol: data.currency_symbol || DEFAULT_SETTINGS.currency_symbol,
    };
  },

  async saveSettings(settings: ShopSettings): Promise<ShopSettings> {
    const { data, error } = await supabase
      .from('shop_settings')
      .upsert({
        id: true,
        shop_name: settings.shop_name,
        phone_number: settings.phone_number,
        address: settings.address,
        receipt_footer: settings.receipt_footer,
        receipt_paper_size: settings.receipt_paper_size,
        currency_symbol: settings.currency_symbol,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      shop_name: data.shop_name || DEFAULT_SETTINGS.shop_name,
      phone_number: data.phone_number || DEFAULT_SETTINGS.phone_number,
      address: data.address || DEFAULT_SETTINGS.address,
      receipt_footer: data.receipt_footer || DEFAULT_SETTINGS.receipt_footer,
      receipt_paper_size: data.receipt_paper_size || DEFAULT_SETTINGS.receipt_paper_size,
      currency_symbol: data.currency_symbol || DEFAULT_SETTINGS.currency_symbol,
    };
  },

  getDefaultSettings(): ShopSettings {
    return { ...DEFAULT_SETTINGS };
  },
};
