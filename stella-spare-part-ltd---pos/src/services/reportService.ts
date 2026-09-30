import { supabase } from './supabaseClient';
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
    // Build date filter
    let startDate: Date | null = null;
    if (period === 'today') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      const now = new Date();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Query sales with items
    let salesQuery = supabase
      .from('sales')
      .select(`
        *,
        sale_items (*)
      `)
      .order('created_at', { ascending: false });

    if (startDate) {
      salesQuery = salesQuery.gte('created_at', startDate.toISOString());
    }

    const { data: sales, error: salesError } = await salesQuery;
    if (salesError) throw salesError;

    const filteredSales = (sales || []).map((s: any) => ({
      id: s.id,
      receipt_number: s.receipt_number,
      customer_id: s.customer_id,
      customer_name: s.customer_name,
      total_amount: Number(s.total_amount),
      discount_amount: Number(s.discount_amount),
      payment_method: s.payment_method,
      amount_received: Number(s.amount_received),
      amount_paid_now: Number(s.amount_paid_now),
      change_given: Number(s.change_given),
      outstanding_credit: Number(s.outstanding_credit),
      notes: s.notes,
      created_at: s.created_at,
      items: (s.sale_items || []).map((item: any) => ({
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        product_name: item.product_name,
        category: item.category,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
      })),
    }));

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

    // Get total outstanding credit from customers_view
    const { data: customers, error: customersError } = await supabase
      .from('customers_view')
      .select('outstanding_balance');

    if (customersError) throw customersError;

    const totalOutstandingCredit = (customers || []).reduce(
      (acc, c) => roundMoney(acc + Number(c.outstanding_balance)),
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
