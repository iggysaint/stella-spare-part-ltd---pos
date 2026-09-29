import React, { useState, useEffect } from 'react';
import { reportService, ReportSummary } from '../../services/reportService';
import { formatCedi } from '../../utils/currency';
import { 
  TrendingUp, 
  Receipt, 
  Banknote, 
  CreditCard, 
  AlertCircle,
  PackageCheck
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const data = await reportService.getReport(period);
        setReport(data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [period]);

  const periodLabel = period === 'today' ? "Today" : period === 'week' ? "This Week" : period === 'month' ? "This Month" : "All Time";

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-5 rounded-lg border border-border">
        <div>
          <span className="text-xs font-semibold text-accent">
            Performance Summary
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-primary mt-0.5">
            Sales & Stock Reports
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Simple breakdown of daily income, cash takings, credit given, and fast-moving parts
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-border">
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
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="p-12 text-center text-secondary">Loading financial report...</div>
      ) : !report ? (
        <div className="p-8 text-center text-secondary">Unable to load report data.</div>
      ) : (
        <div className="space-y-6">
          
          {/* Key Metric Headline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Revenue */}
            <div className="bg-surface p-5 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-secondary">
                  Total Sales Volume ({periodLabel})
                </span>
                <div className="p-2 rounded-lg bg-positive-soft text-positive border border-positive">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-primary">
                {formatCedi(report.totalSales)}
              </h3>
              <p className="text-xs text-secondary mt-1">
                Gross sales across {report.transactionsCount} receipts
              </p>
            </div>

            {/* Cash Collected */}
            <div className="bg-surface p-5 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-secondary">
                  Cash in Register ({periodLabel})
                </span>
                <div className="p-2 rounded-lg bg-positive-soft text-positive border border-positive">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-positive">
                {formatCedi(report.cashSales)}
              </h3>
              <p className="text-xs text-secondary mt-1">
                Actual physical cash collected
              </p>
            </div>

            {/* Total Outstanding Debt */}
            <div className="bg-surface p-5 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-secondary">
                  Customer Credit Book
                </span>
                <div className="p-2 rounded-lg bg-surface-muted text-danger border border-danger">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-danger">
                {formatCedi(report.totalOutstandingCredit)}
              </h3>
              <p className="text-xs text-secondary mt-1">
                Active balances owed by customers
              </p>
            </div>

          </div>

          {/* Payment Method Breakdown Cards: Cash vs Credit */}
          <div className="bg-surface p-5 rounded-lg border border-border space-y-4">
            <h3 className="font-bold text-base text-primary">
              Payment Method Breakdown ({periodLabel})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cash */}
              <div className="p-4 rounded-lg bg-surface-muted border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-positive flex items-center gap-1.5">
                    <Banknote className="w-4 h-4" />
                    <span>Cash Sales</span>
                  </span>
                  <p className="text-2xl font-black text-primary mt-1">
                    {formatCedi(report.cashSales)}
                  </p>
                </div>
                <div className="text-xs font-bold text-positive bg-positive-soft border border-positive px-2.5 py-1 rounded-lg">
                  {report.totalSales > 0 ? Math.round((report.cashSales / report.totalSales) * 100) : 0}%
                </div>
              </div>

              {/* Credit Sales */}
              <div className="p-4 rounded-lg bg-surface-muted border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>Credit Given</span>
                  </span>
                  <p className="text-2xl font-black text-primary mt-1">
                    {formatCedi(report.creditSales)}
                  </p>
                </div>
                <div className="text-xs font-bold text-secondary bg-surface border border-border px-2.5 py-1 rounded-lg">
                  {report.totalSales > 0 ? Math.round((report.creditSales / report.totalSales) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-surface p-5 rounded-lg border border-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-base text-primary">
                  Top-Selling Spare Parts ({periodLabel})
                </h3>
              </div>
              <span className="text-xs text-secondary font-medium">Ranked by units sold</span>
            </div>

            {report.topProducts.length === 0 ? (
              <p className="py-6 text-center text-xs text-secondary">
                No part sales recorded in this time period.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {report.topProducts.map((p, idx) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-surface-muted border border-border text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-primary truncate">{p.name}</p>
                        <p className="text-xs text-secondary">{p.category}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-sm text-primary block">
                        {formatCedi(p.totalRevenue)}
                      </span>
                      <span className="text-xs font-bold text-accent">
                        {p.quantitySold} {p.quantitySold === 1 ? 'unit' : 'units'} sold
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
