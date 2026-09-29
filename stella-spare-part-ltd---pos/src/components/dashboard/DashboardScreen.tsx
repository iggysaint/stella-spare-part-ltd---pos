import React, { useState, useEffect } from 'react';
import { Sale, Product, UserSession } from '../../types';
import { salesService } from '../../services/salesService';
import { productService } from '../../services/productService';
import { formatCedi, roundMoney } from '../../utils/currency';
import { formatTimeOnly, getGreeting } from '../../utils/date';
import { 
  TrendingUp, 
  Receipt, 
  CreditCard, 
  AlertCircle, 
  PlusCircle, 
  UserPlus, 
  PackagePlus, 
  ArrowRight,
  Clock,
  CheckCircle2,
  Package
} from 'lucide-react';

interface DashboardScreenProps {
  onNavigate: (tab: string) => void;
  onOpenAddProduct?: () => void;
  onOpenAddCustomer?: () => void;
  user?: UserSession | null;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  onOpenAddProduct,
  onOpenAddCustomer,
  user,
}) => {
  const [stats, setStats] = useState({
    todaySalesAmount: 0,
    todayTransactionsCount: 0,
    todayCreditGiven: 0,
    totalOutstandingCredit: 0,
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const [dashStats, sales, lowStock] = await Promise.all([
          salesService.getDashboardStats(),
          salesService.getSales(),
          productService.getLowStockProducts(),
        ]);

        setStats({
          todaySalesAmount: roundMoney(dashStats.todaySalesAmount),
          todayTransactionsCount: dashStats.todayTransactionsCount,
          todayCreditGiven: roundMoney(dashStats.todayCreditGiven),
          totalOutstandingCredit: roundMoney(dashStats.totalOutstandingCredit),
        });
        setRecentSales(sales.slice(0, 5));
        setLowStockProducts(lowStock.slice(0, 5));
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const greeting = getGreeting();
  const displayName = user?.name || 'Mama Stella';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      
      {/* Top Greeting & Shop Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-5 rounded-lg border border-border">
        <div>
          <span className="text-xs font-semibold text-accent">
            Counter Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-primary mt-0.5">
            {greeting}, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Stella Spare Part Ltd — Tema Station, Accra
          </p>
        </div>

        {/* Big New Sale CTA */}
        <div>
          <button
            onClick={() => onNavigate('pos')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition"
          >
            <PlusCircle className="w-5 h-5 text-surface" />
            <span>+ NEW SALE</span>
          </button>
        </div>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-surface p-4 sm:p-5 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary">
              Today's Sales
            </span>
            <div className="p-2 rounded-lg bg-positive-soft text-positive border border-positive">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-primary">
            {isLoading ? '...' : formatCedi(stats.todaySalesAmount)}
          </h3>
          <p className="text-[11px] text-positive font-semibold mt-1">
            Daily takings
          </p>
        </div>

        {/* Transactions */}
        <div className="bg-surface p-4 sm:p-5 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary">
              Transactions
            </span>
            <div className="p-2 rounded-lg bg-accent-soft text-accent border border-border">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-primary">
            {isLoading ? '...' : stats.todayTransactionsCount}
          </h3>
          <p className="text-[11px] text-secondary mt-1">
            Receipts completed
          </p>
        </div>

        {/* Credit Given Today */}
        <div className="bg-surface p-4 sm:p-5 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary">
              Credit Given Today
            </span>
            <div className="p-2 rounded-lg bg-surface-muted text-warning border border-warning">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-primary">
            {isLoading ? '...' : formatCedi(stats.todayCreditGiven)}
          </h3>
          <p className="text-[11px] text-secondary mt-1">
            Parts taken on book
          </p>
        </div>

        {/* Total Outstanding Book */}
        <div className="bg-surface p-4 sm:p-5 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary">
              Total Credit Book
            </span>
            <div className="p-2 rounded-lg bg-surface-muted text-danger border border-danger">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-primary">
            {isLoading ? '...' : formatCedi(stats.totalOutstandingCredit)}
          </h3>
          <p className="text-[11px] text-secondary mt-1">
            Owed by customers
          </p>
        </div>
      </div>

      {/* Quick Launchpad Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('pos')}
          className="p-3.5 bg-surface hover:bg-surface-muted border border-border rounded-lg flex items-center gap-3 transition text-left"
        >
          <div className="p-2 rounded-lg bg-accent text-surface shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-primary block">Sell Parts</span>
            <span className="text-[11px] text-secondary block">Open POS register</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('products')}
          className="p-3.5 bg-surface hover:bg-surface-muted border border-border rounded-lg flex items-center gap-3 transition text-left"
        >
          <div className="p-2 rounded-lg bg-accent-soft text-accent border border-border shrink-0">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-primary block">Inventory</span>
            <span className="text-[11px] text-secondary block">Manage stock & prices</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('customers')}
          className="p-3.5 bg-surface hover:bg-surface-muted border border-border rounded-lg flex items-center gap-3 transition text-left"
        >
          <div className="p-2 rounded-lg bg-surface-muted text-secondary border border-border shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-primary block">Credit Book</span>
            <span className="text-[11px] text-secondary block">Record debt & payments</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('reports')}
          className="p-3.5 bg-surface hover:bg-surface-muted border border-border rounded-lg flex items-center gap-3 transition text-left"
        >
          <div className="p-2 rounded-lg bg-positive-soft text-positive border border-positive shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-primary block">Reports</span>
            <span className="text-[11px] text-secondary block">Sales summary & top items</span>
          </div>
        </button>
      </div>

      {/* Main Grid: Recent Sales & Low Stock Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Transactions (7 cols) */}
        <div className="lg:col-span-7 bg-surface rounded-lg p-5 border border-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-bold text-base text-primary flex items-center gap-2">
                <Receipt className="w-4 h-4 text-accent" />
                <span>Recent Counter Sales</span>
              </h3>
              <p className="text-xs text-secondary">Latest receipts printed</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentSales.length === 0 ? (
              <div className="p-8 text-center rounded-lg bg-surface-muted border border-border space-y-3">
                <Receipt className="w-8 h-8 text-secondary mx-auto opacity-50" />
                <div>
                  <p className="text-sm font-semibold text-primary">No sales yet today</p>
                  <p className="text-xs text-secondary mt-0.5">Start counter register to complete receipts</p>
                </div>
                <button
                  onClick={() => onNavigate('pos')}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-surface rounded-lg font-bold text-xs transition"
                >
                  + Start First Sale
                </button>
              </div>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => onNavigate('sales')}
                  className="p-3 rounded-lg border border-border bg-surface hover:bg-surface-muted flex items-center justify-between gap-3 cursor-pointer transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        {sale.receipt_number}
                      </span>
                      {sale.customer_name && (
                        <span className="text-xs text-secondary font-medium truncate max-w-[140px]">
                          · {sale.customer_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeOnly(sale.created_at)}
                      </span>
                      {sale.items && sale.items.length > 0 && (
                        <span>({sale.items.length} parts)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        sale.payment_method === 'CASH'
                          ? 'bg-positive-soft text-positive border-positive'
                          : 'bg-surface-muted text-secondary border-border'
                      }`}
                    >
                      {sale.payment_method}
                    </span>
                    <span className="font-black text-sm text-primary">
                      {formatCedi(sale.total_amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Watch (5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-lg p-5 border border-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="font-bold text-base text-primary flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-warning" />
                <span>Low Stock Alert</span>
              </h3>
              <p className="text-xs text-secondary">Parts needing restock soon</p>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {lowStockProducts.length === 0 ? (
              <div className="p-4 text-center rounded-lg bg-positive-soft border border-positive text-positive text-xs font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-positive" />
                <span>All parts have healthy stock levels</span>
              </div>
            ) : (
              lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => onNavigate('products')}
                  className="p-2.5 rounded-lg border border-border bg-surface hover:bg-surface-muted flex items-center justify-between gap-2 cursor-pointer transition text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-primary truncate">{prod.name}</p>
                    <p className="text-[11px] text-secondary">{prod.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-lg font-bold text-[10px] bg-surface-muted text-warning border border-warning">
                      {prod.stock_quantity} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
