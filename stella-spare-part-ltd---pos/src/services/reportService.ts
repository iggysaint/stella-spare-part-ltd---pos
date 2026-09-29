import { storage } from './storage';
import { isToday, isThisWeek, isThisMonth } from '../utils/date';
import { Sale } from '../types';
import { roundMoney } from '../utils/currency';

export interface TopProductStat {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface ReportSummary {
  period: 'today' | 'week' | 'month' | 'all';
  totalSales: number;
  transactionsCount: number;
  cashSales: number;
  creditSales: number;
  totalOutstandingCredit: number;
  topProducts: TopProductStat[];
}

class ReportService {
  async getReport(period: 'today' | 'week' | 'month' | 'all' = 'today'): Promise<ReportSummary> {
    const allSales = storage.getSales();
    const allCustomers = storage.getCustomers();

    let filteredSales: Sale[] = allSales;
    if (period === 'today') {
      filteredSales = allSales.filter((s) => isToday(s.created_at));
    } else if (period === 'week') {
      filteredSales = allSales.filter((s) => isThisWeek(s.created_at));
    } else if (period === 'month') {
      filteredSales = allSales.filter((s) => isThisMonth(s.created_at));
    }

    const totalSales = filteredSales.reduce((acc, s) => roundMoney(acc + s.total_amount), 0);
    const transactionsCount = filteredSales.length;

    let cashSales = 0;
    let creditSales = 0;

    const productMap = new Map<string, { name: string; category: string; quantity: number; revenue: number }>();

    for (const sale of filteredSales) {
      if (sale.payment_method === 'CASH') cashSales = roundMoney(cashSales + sale.total_amount);
      if (sale.payment_method === 'CREDIT') creditSales = roundMoney(creditSales + sale.total_amount);

      for (const item of sale.items || []) {
        const existing = productMap.get(item.product_id) || {
          name: item.product_name,
          category: item.category || 'General',
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue = roundMoney(existing.revenue + item.total_price);
        productMap.set(item.product_id, existing);
      }
    }

    const topProducts: TopProductStat[] = Array.from(productMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        category: data.category,
        quantitySold: data.quantity,
        totalRevenue: roundMoney(data.revenue),
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    const totalOutstandingCredit = allCustomers.reduce(
      (acc, c) => roundMoney(acc + (c.outstanding_balance || 0)),
      0
    );

    return {
      period,
      totalSales: roundMoney(totalSales),
      transactionsCount,
      cashSales: roundMoney(cashSales),
      creditSales: roundMoney(creditSales),
      totalOutstandingCredit: roundMoney(totalOutstandingCredit),
      topProducts,
    };
  }
}

export const reportService = new ReportService();
