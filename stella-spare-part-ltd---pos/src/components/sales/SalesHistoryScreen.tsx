import React, { useState, useEffect } from 'react';
import { Sale, PaymentMethod } from '../../types';
import { salesService } from '../../services/salesService';
import { receiptService } from '../../services/receiptService';
import { formatCedi, roundMoney } from '../../utils/currency';
import { formatReceiptDate } from '../../utils/date';
import { ThermalReceipt } from '../common/ThermalReceipt';
import { 
  ReceiptText, 
  Search, 
  Printer, 
  Calendar, 
  Banknote, 
  CreditCard, 
  X,
  PlusCircle
} from 'lucide-react';

interface SalesHistoryScreenProps {
  initialSaleId?: string;
  onNavigate?: (tab: string) => void;
}

export const SalesHistoryScreen: React.FC<SalesHistoryScreenProps> = ({ 
  initialSaleId,
  onNavigate 
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected receipt to view/reprint modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const list = await salesService.getSales({
        period,
        paymentMethod: paymentFilter === 'ALL' ? undefined : (paymentFilter as PaymentMethod),
        searchQuery: searchQuery,
      });
      setSales(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [period, paymentFilter, searchQuery]);

  // If passed an initialSaleId, open it
  useEffect(() => {
    if (initialSaleId) {
      salesService.getSaleById(initialSaleId).then((s) => {
        if (s) setSelectedSale(s);
      });
    }
  }, [initialSaleId]);

  const handlePrint = async (sale: Sale) => {
    await receiptService.printReceipt(sale);
  };

  const totalFilteredSum = roundMoney(
    sales.reduce((acc, s) => acc + s.total_amount, 0)
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-5 rounded-lg border border-border">
        <div>
          <span className="text-xs font-semibold text-accent">
            Records & Audits
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-primary mt-0.5">
            Sales & Receipts History
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Review past sales, verify payments, and reprint customer receipts
          </p>
        </div>

        <div className="bg-surface-muted px-4 py-3 rounded-lg border border-border sm:text-right">
          <span className="text-[10px] font-semibold text-secondary block">
            Period Total
          </span>
          <span className="text-xl font-black text-primary">
            {formatCedi(totalFilteredSum)}
          </span>
          <span className="text-[11px] text-secondary block">
            {sales.length} receipts
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-lg border border-border space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-border shrink-0 overflow-x-auto">
            {(['today', 'week', 'month', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition capitalize ${
                  period === p
                    ? 'bg-surface text-primary border border-border'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {p === 'today' ? "Today" : p === 'week' ? "This Week" : p === 'month' ? "This Month" : "All Time"}
              </button>
            ))}
          </div>

          {/* Payment Method filter: ALL, CASH, CREDIT */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border text-xs font-bold text-primary bg-surface outline-hidden focus:border-accent"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">Cash Only</option>
              <option value="CREDIT">Credit Only</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receipt #, customer name, or part..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface focus:border-accent text-sm text-primary outline-hidden"
            />
          </div>

        </div>
      </div>

      {/* Sales List */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-secondary">Loading sales records...</div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-secondary space-y-3">
            <ReceiptText className="w-12 h-12 mx-auto opacity-30 text-secondary" />
            <div>
              <h4 className="font-bold text-base text-primary">No sales recorded</h4>
              <p className="text-xs text-secondary mt-0.5">
                Completed sales from the POS counter will show up here.
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('pos')}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-surface rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Start New Sale</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="p-4 sm:p-5 hover:bg-surface-muted transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-primary">
                      {sale.receipt_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                        sale.payment_method === 'CASH'
                          ? 'bg-positive-soft text-positive border-positive'
                          : 'bg-surface-muted text-secondary border-border'
                      }`}
                    >
                      {sale.payment_method === 'CASH' && <Banknote className="w-3 h-3" />}
                      {sale.payment_method === 'CREDIT' && <CreditCard className="w-3 h-3" />}
                      <span>{sale.payment_method}</span>
                    </span>
                  </div>

                  <p className="text-xs font-bold text-primary">
                    {sale.customer_name || 'Walk-in Customer'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-secondary">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatReceiptDate(sale.created_at)}
                    </span>
                    <span>•</span>
                    <span>
                      {sale.items?.length || 0} {(sale.items?.length === 1 ? 'part' : 'parts')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border">
                  <div className="text-right">
                    <span className="text-xs text-secondary block">Total Paid/Due</span>
                    <span className="text-base sm:text-lg font-black text-primary">
                      {formatCedi(sale.total_amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSale(sale)}
                      className="px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface text-secondary border border-border text-xs font-bold transition"
                    >
                      View Receipt
                    </button>
                    <button
                      onClick={() => handlePrint(sale)}
                      className="p-2 rounded-lg bg-surface-muted hover:bg-surface text-secondary border border-border transition"
                      title="Reprint receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sale Detail / Receipt Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-sm bg-surface rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[92vh] border border-border animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 bg-surface-muted border-b border-border flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-primary">
                {selectedSale.receipt_number}
              </span>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1 rounded-lg text-secondary hover:text-primary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Receipt Preview */}
            <div className="overflow-y-auto p-4 flex-1 flex justify-center bg-surface-muted">
              <div className="bg-surface rounded-lg p-2 border border-border max-w-[80mm] w-full">
                <ThermalReceipt receipt={receiptService.formatReceipt(selectedSale)} />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3.5 bg-surface-muted border-t border-border flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedSale(null)}
                className="flex-1 py-2.5 rounded-lg border border-border bg-surface text-secondary text-xs font-bold hover:bg-surface-muted transition"
              >
                Close
              </button>
              <button
                onClick={() => handlePrint(selectedSale)}
                className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-surface text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
