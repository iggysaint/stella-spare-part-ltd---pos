import { Product, Customer, Sale, CreditTransaction, ShopSettings, UserSession } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'stella_pos_products_v2',
  CUSTOMERS: 'stella_pos_customers_v2',
  SALES: 'stella_pos_sales_v2',
  CREDIT_TRANSACTIONS: 'stella_pos_credit_transactions_v2',
  SETTINGS: 'stella_pos_settings_v2',
  SESSION: 'stella_pos_session_v2',
  RECEIPT_COUNTER: 'stella_pos_receipt_counter_v2',
};

export const DEFAULT_SETTINGS: ShopSettings = {
  shop_name: 'Stella Spare Part Ltd',
  phone_number: '0595259640',
  address: 'Tema Station, Accra',
  receipt_footer: 'Thank you!',
  receipt_paper_size: '80mm',
  currency_symbol: 'GH₵',
};

export const DEFAULT_USER: UserSession = {
  id: '',
  name: '',
  isLoggedIn: false,
};

class StorageEngine {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.saveSettings(DEFAULT_SETTINGS);
    }
  }

  getProducts(): Product[] {
    return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  }

  saveProducts(products: Product[]): void {
    this.set(STORAGE_KEYS.PRODUCTS, products);
  }

  getCustomers(): Customer[] {
    return this.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  }

  saveCustomers(customers: Customer[]): void {
    this.set(STORAGE_KEYS.CUSTOMERS, customers);
  }

  getSales(): Sale[] {
    return this.get<Sale[]>(STORAGE_KEYS.SALES, []);
  }

  saveSales(sales: Sale[]): void {
    this.set(STORAGE_KEYS.SALES, sales);
  }

  getCreditTransactions(): CreditTransaction[] {
    return this.get<CreditTransaction[]>(STORAGE_KEYS.CREDIT_TRANSACTIONS, []);
  }

  saveCreditTransactions(transactions: CreditTransaction[]): void {
    this.set(STORAGE_KEYS.CREDIT_TRANSACTIONS, transactions);
  }

  getSettings(): ShopSettings {
    return this.get<ShopSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  saveSettings(settings: ShopSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  getSession(): UserSession {
    return this.get<UserSession>(STORAGE_KEYS.SESSION, DEFAULT_USER);
  }

  saveSession(session: UserSession): void {
    this.set(STORAGE_KEYS.SESSION, session);
  }

  getNextReceiptNumber(): string {
    const current = this.get<number>(STORAGE_KEYS.RECEIPT_COUNTER, 1);
    const next = current + 1;
    this.set(STORAGE_KEYS.RECEIPT_COUNTER, next);
    return `REC-${String(current).padStart(6, '0')}`;
  }
}

export const storage = new StorageEngine();
storage.init();
