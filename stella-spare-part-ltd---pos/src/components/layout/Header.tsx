import React, { useState } from 'react';
import { 
  LogOut, 
  ShoppingCart, 
  Users, 
  Boxes, 
  ReceiptText, 
  ChevronDown, 
  Wrench 
} from 'lucide-react';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { getGreeting } from '../../utils/date';
import { UserSession } from '../../types';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  user: UserSession;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  user,
  onLogout,
}) => {
  const greeting = getGreeting();
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  return (
    <header className="no-print bg-surface text-primary border-b border-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-accent text-surface flex items-center justify-center">
              <Wrench className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-primary">
                  STELLA <span className="text-accent">SPARE PARTS</span>
                </span>
              </div>
              <p className="text-[11px] text-secondary hidden sm:block">
                {greeting}, <strong className="text-primary font-semibold">{user.name || 'Admin'}</strong>
              </p>
            </div>
          </div>

          {/* Clean Primary Navigation (Desktop / Tablet) */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            {/* 1. SELL (Primary Action) */}
            <button
              onClick={() => onNavigate('pos')}
              className={`px-3.5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${
                currentTab === 'pos'
                  ? 'bg-accent text-surface'
                  : 'bg-accent-soft text-accent hover:bg-accent-soft/80'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>SELL PARTS</span>
            </button>

            {/* 2. CUSTOMERS & CREDIT */}
            <button
              onClick={() => onNavigate('customers')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                currentTab === 'customers' || currentTab === 'credit'
                  ? 'bg-surface-muted text-accent font-bold border border-border'
                  : 'text-secondary hover:text-primary hover:bg-surface-muted'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers & Credit</span>
            </button>

            {/* 3. STOCK / INVENTORY */}
            <button
              onClick={() => onNavigate('products')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                currentTab === 'products'
                  ? 'bg-surface-muted text-accent font-bold border border-border'
                  : 'text-secondary hover:text-primary hover:bg-surface-muted'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Stock & Parts</span>
            </button>

            {/* 4. TODAY'S SALES / RECEIPTS */}
            <button
              onClick={() => onNavigate('sales')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                currentTab === 'sales'
                  ? 'bg-surface-muted text-accent font-bold border border-border'
                  : 'text-secondary hover:text-primary hover:bg-surface-muted'
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              <span>Sales History</span>
            </button>

            {/* MORE (Dropdown for Reports / Settings / Dashboard) */}
            <div className="relative">
              <button
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition ${
                  ['dashboard', 'reports', 'settings'].includes(currentTab)
                    ? 'bg-surface-muted text-accent font-bold border border-border'
                    : 'text-secondary hover:text-primary hover:bg-surface-muted'
                }`}
              >
                <span>More</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {showMoreDropdown && (
                <div 
                  className="absolute right-0 top-full mt-1.5 w-48 bg-surface rounded-lg shadow-xl border border-border p-1.5 space-y-0.5 z-50"
                  onClick={() => setShowMoreDropdown(false)}
                >
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-surface-muted transition"
                  >
                    Dashboard Overview
                  </button>
                  <button
                    onClick={() => onNavigate('reports')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-surface-muted transition"
                  >
                    Sales Reports
                  </button>
                  <button
                    onClick={() => onNavigate('settings')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-surface-muted transition"
                  >
                    Settings & Appearance
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Right actions: Online/Offline indicator and Logout (desktop also has PWA install) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <OfflineIndicator />

            <div className="hidden md:block">
              <PWAInstallButton />
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-secondary hover:text-danger hover:bg-surface-muted transition border border-transparent hover:border-border"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
