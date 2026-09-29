import React, { useState, useEffect } from 'react';
import { ShopSettings, UserSession } from '../../types';
import { settingsService } from '../../services/settingsService';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { salesService } from '../../services/salesService';
import { paymentService } from '../../services/paymentService';
import { receiptService } from '../../services/receiptService';
import { getStoredTheme, applyTheme, Theme } from '../../utils/theme';
import { 
  Store, 
  Printer, 
  Download, 
  LogOut, 
  Check, 
  Phone, 
  MapPin, 
  FileText,
  Moon,
  Sun
} from 'lucide-react';

interface SettingsScreenProps {
  onLogout: () => void;
  user?: UserSession | null;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout, user }) => {
  const [settings, setSettings] = useState<ShopSettings>(settingsService.getDefaultSettings());
  const [isSaved, setIsSaved] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const s = await settingsService.getSettings();
      setSettings(s);
      setIsLoading(false);
    };
    load();
    setCurrentTheme(getStoredTheme());

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: Theme }>;
      if (customEvent.detail?.theme) {
        setCurrentTheme(customEvent.detail.theme);
      }
    };

    window.addEventListener('stella:theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('stella:theme-change', handleThemeChange);
    };
  }, []);

  const handleThemeToggle = (newTheme: Theme) => {
    setCurrentTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsService.saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTestPrint = async () => {
    const testSale = {
      id: 'test_print',
      receipt_number: 'REC-TEST-PRINT',
      customer_id: null,
      customer_name: 'Test Customer',
      total_amount: 330,
      discount_amount: 0,
      payment_method: 'CASH' as const,
      amount_received: 350,
      amount_paid_now: 330,
      change_given: 20,
      outstanding_credit: 0,
      created_at: new Date().toISOString(),
      items: [
        {
          id: 't_item_1',
          sale_id: 'test_print',
          product_id: 'prod_test_01',
          product_name: 'Brake Pad (Front) - Test',
          quantity: 1,
          unit_price: 250,
          total_price: 250,
        },
        {
          id: 't_item_2',
          sale_id: 'test_print',
          product_id: 'prod_test_02',
          product_name: 'Oil Filter (Diesel) - Test',
          quantity: 1,
          unit_price: 80,
          total_price: 80,
        },
      ],
    };

    await receiptService.printReceipt(testSale);
  };

  const handleExportData = async () => {
    const [products, customers, sales, currentSettings] = await Promise.all([
      productService.getProducts(),
      customerService.getCustomers(),
      salesService.getSales(),
      settingsService.getSettings(),
    ]);

    const backup = {
      products,
      customers,
      sales,
      settings: currentSettings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stella_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-5 rounded-lg border border-border">
        <div>
          <span className="text-xs font-semibold text-accent">
            System Preferences
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-primary mt-0.5">
            Shop & System Settings
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Configure appearance, receipt header, paper format, and database backups
          </p>
        </div>

        {isSaved && (
          <div className="px-3.5 py-2 bg-positive-soft border border-positive text-positive rounded-lg text-xs font-bold flex items-center gap-1.5">
            <Check className="w-4 h-4 text-positive" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      {/* Dark Mode & Theme Toggle Card */}
      <div className="bg-surface p-6 rounded-lg border border-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            {currentTheme === 'dark' ? (
              <Moon className="w-5 h-5 text-accent" />
            ) : (
              <Sun className="w-5 h-5 text-accent" />
            )}
            <div>
              <h3 className="font-bold text-base text-primary">Display Theme</h3>
              <p className="text-xs text-secondary">Choose light mode or dark mode for the POS terminal</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-surface-muted text-secondary border border-border">
            {currentTheme === 'dark' ? 'Dark Active' : 'Light Active'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => handleThemeToggle('light')}
            className={`p-3.5 rounded-lg border font-bold text-left transition flex items-center gap-3 ${
              currentTheme === 'light'
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-border bg-surface-muted hover:bg-surface text-secondary'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary">
              <Sun className="w-4 h-4 text-accent" />
            </div>
            <div>
              <span className="text-sm font-bold block text-primary">Light Mode</span>
              <span className="text-xs text-secondary block">Clean white surface</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleThemeToggle('dark')}
            className={`p-3.5 rounded-lg border font-bold text-left transition flex items-center gap-3 ${
              currentTheme === 'dark'
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-border bg-surface-muted hover:bg-surface text-secondary'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary">
              <Moon className="w-4 h-4 text-accent" />
            </div>
            <div>
              <span className="text-sm font-bold block text-primary">Dark Mode</span>
              <span className="text-xs text-secondary block">Low-light counter</span>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Shop Information */}
        <div className="bg-surface p-6 rounded-lg border border-border space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Store className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-base text-primary">Shop Header Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                Shop Business Name
              </label>
              <input
                type="text"
                required
                value={settings.shop_name}
                onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm font-bold text-primary outline-hidden focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={settings.phone_number}
                  onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-sm font-semibold text-primary outline-hidden focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Shop Address / Market Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-sm text-primary outline-hidden focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Receipt Footer Message
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-secondary absolute left-3.5 top-3" />
              <textarea
                rows={2}
                value={settings.receipt_footer}
                onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-xs text-primary outline-hidden focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Thermal Receipt Settings */}
        <div className="bg-surface p-6 rounded-lg border border-border space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Printer className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-base text-primary">Thermal Printer Format</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-2">
              Receipt Paper Width
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, receipt_paper_size: '80mm' })}
                className={`p-3.5 rounded-lg border font-bold text-left transition ${
                  settings.receipt_paper_size === '80mm'
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border bg-surface hover:bg-surface-muted text-secondary'
                }`}
              >
                <span className="text-sm font-bold block text-primary">80mm Standard</span>
                <span className="text-xs text-secondary mt-0.5 block">
                  Best for counter thermal POS printers (Epson, Sunmi, Xprinter)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, receipt_paper_size: '58mm' })}
                className={`p-3.5 rounded-lg border font-bold text-left transition ${
                  settings.receipt_paper_size === '58mm'
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border bg-surface hover:bg-surface-muted text-secondary'
                }`}
              >
                <span className="text-sm font-bold block text-primary">58mm Compact</span>
                <span className="text-xs text-secondary mt-0.5 block">
                  Best for small handheld mobile receipt printers
                </span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestPrint}
              className="px-4 py-2.5 rounded-lg bg-surface-muted hover:bg-surface text-primary border border-border font-bold text-xs flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-secondary" />
              <span>Test Print Receipt Sample</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-sm transition"
          >
            Save All Settings
          </button>
        </div>

      </form>

      {/* Data Management & Account */}
      <div className="bg-surface p-6 rounded-lg border border-border space-y-4">
        <h3 className="font-bold text-base text-primary pb-2 border-b border-border">
          Data Management & Counter Session
        </h3>

        <div>
          <button
            type="button"
            onClick={handleExportData}
            className="w-full sm:w-auto px-5 py-3 rounded-lg border border-border hover:bg-surface-muted text-primary font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-secondary" />
            <span>Export Data Backup (JSON)</span>
          </button>
        </div>

        <div className="pt-3 border-t border-border flex justify-between items-center">
          <span className="text-xs text-secondary">
            Counter session active for {user?.name || 'Administrator'}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-danger border border-danger bg-danger/10 hover:opacity-90 flex items-center gap-1.5 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

    </div>
  );
};
