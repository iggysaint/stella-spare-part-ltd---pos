import React, { useState } from 'react';
import { 
  Home, 
  ShoppingCart, 
  Boxes, 
  Users, 
  ReceiptText, 
  Settings as SettingsIcon,
  X,
  BarChart3
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onNavigate }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleTabClick = (tab: string) => {
    setShowMoreMenu(false);
    onNavigate(tab);
  };

  return (
    <>
      {/* Mobile Bottom Bar (visible on < lg screens) */}
      <nav 
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border px-2 py-1.5"
        role="navigation"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          
          {/* 1. Home / Dashboard */}
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition ${
              currentTab === 'dashboard'
                ? 'text-accent font-bold'
                : 'text-secondary hover:text-primary font-medium'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Home</span>
          </button>

          {/* 2. Stock / Parts */}
          <button
            onClick={() => handleTabClick('products')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition ${
              currentTab === 'products'
                ? 'text-accent font-bold'
                : 'text-secondary hover:text-primary font-medium'
            }`}
          >
            <Boxes className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Stock</span>
          </button>

          {/* 3. Center "Sell" Action Button (Unified border-radius, flat accent) */}
          <div className="relative -top-2">
            <button
              onClick={() => handleTabClick('pos')}
              className={`flex flex-col items-center justify-center w-13 h-13 rounded-lg bg-accent text-surface font-bold border-2 border-surface transition active:scale-95 ${
                currentTab === 'pos' ? 'ring-2 ring-accent' : ''
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-0.5">Sell</span>
            </button>
          </div>

          {/* 4. Customers & Credit */}
          <button
            onClick={() => handleTabClick('customers')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition ${
              currentTab === 'customers' || currentTab === 'credit'
                ? 'text-accent font-bold'
                : 'text-secondary hover:text-primary font-medium'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Credit</span>
          </button>

          {/* 5. Sales / Receipts */}
          <button
            onClick={() => handleTabClick('sales')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition ${
              currentTab === 'sales'
                ? 'text-accent font-bold'
                : 'text-secondary hover:text-primary font-medium'
            }`}
          >
            <ReceiptText className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Sales</span>
          </button>

        </div>
      </nav>

      {/* "More" Drawer if needed (Elevated Surface) */}
      {showMoreMenu && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs">
          <div 
            className="w-full bg-surface rounded-t-lg p-5 border-t border-border shadow-xl space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-primary">More Options</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-lg text-secondary hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTabClick('reports')}
                className="p-4 rounded-lg bg-surface-muted border border-border flex flex-col items-center justify-center text-center gap-2 hover:bg-surface transition"
              >
                <BarChart3 className="w-6 h-6 text-accent" />
                <span className="font-bold text-xs text-primary">Sales Reports</span>
              </button>

              <button
                onClick={() => handleTabClick('settings')}
                className="p-4 rounded-lg bg-surface-muted border border-border flex flex-col items-center justify-center text-center gap-2 hover:bg-surface transition"
              >
                <SettingsIcon className="w-6 h-6 text-accent" />
                <span className="font-bold text-xs text-primary">Settings & Printer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
