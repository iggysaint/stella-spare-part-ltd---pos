import { Sale, CartItem, PaymentMethod, SaleItem, CreditTransaction } from '../types';
import { supabase } from './supabaseClient';
import { productService } from './productService';
import { customerService } from './customerService';
import { isToday, isThisWeek, isThisMonth } from '../utils/date';
import { roundMoney } from '../utils/currency';

export interface CreateSaleInput {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  discountAmount?: number;
  // For Cash
  amountReceived?: number;
  // For Credit
  customerId?: string;
  amountPaidNow?: number; // Partial cash payment at checkout
  notes?: string;
}

export interface SalesFilter {
  period?: 'today' | 'week' | 'month' | 'all';
  searchQuery?: string;
  paymentMethod?: PaymentMethod | 'ALL';
}

class SalesService {
  async getSales(filter?: SalesFilter): Promise<Sale[]> {
    let query = supabase
      .from('sales')
      .select(`
        *,
        sale_items (*)
      `)
      .order('created_at', { ascending: false });

    if (filter?.period) {
      const now = new Date();
      let startDate: Date;

      if (filter.period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (filter.period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
      } else if (filter.period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        startDate = new Date(0);
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    if (filter?.paymentMethod && filter.paymentMethod !== 'ALL') {
      query = query.eq('payment_method', filter.paymentMethod);
    }

    const { data, error } = await query;
    if (error) throw error;

    let list = (data || []).map((s: any) => ({
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

    if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.trim().toLowerCase();
      list = list.filter((s) => {
        return (
          s.receipt_number.toLowerCase().includes(q) ||
          (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
          s.items?.some((item) => item.product_name.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }

  async getSaleById(id: string): Promise<Sale | null> {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (*)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    if (!data) return null;

    return {
      id: data.id,
      receipt_number: data.receipt_number,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      total_amount: Number(data.total_amount),
      discount_amount: Number(data.discount_amount),
      payment_method: data.payment_method,
      amount_received: Number(data.amount_received),
      amount_paid_now: Number(data.amount_paid_now),
      change_given: Number(data.change_given),
      outstanding_credit: Number(data.outstanding_credit),
      notes: data.notes,
      created_at: data.created_at,
      items: (data.sale_items || []).map((item: any) => ({
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        product_name: item.product_name,
        category: item.category,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
      })),
    };
  }

  async createSale(input: CreateSaleInput): Promise<Sale> {
    if (!input.items || input.items.length === 0) {
      throw new Error('Your cart is empty. Add parts before checkout.');
    }

    // Calculate totals
    const grossTotal = input.items.reduce((sum, i) => roundMoney(sum + roundMoney(i.total_price)), 0);
    const discount = Math.max(0, roundMoney(input.discountAmount || 0));
    const netTotal = Math.max(0, roundMoney(grossTotal - discount));

    // Prepare items for RPC
    const items = input.items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: roundMoney(item.unit_price),
    }));

    // Prepare RPC parameters
    const rpcParams: any = {
      p_items: items,
      p_payment_method: input.paymentMethod,
      p_discount: discount,
    };

    if (input.paymentMethod === 'CASH') {
      const amountReceived = roundMoney(input.amountReceived ?? netTotal);
      if (roundMoney(amountReceived) < roundMoney(netTotal)) {
        throw new Error('Amount received cannot be less than the total sale amount.');
      }
      rpcParams.p_amount_received = amountReceived;
    } else if (input.paymentMethod === 'CREDIT') {
      if (!input.customerId) {
        throw new Error('Please select a customer for credit sale.');
      }
      rpcParams.p_customer_id = input.customerId;
      rpcParams.p_amount_paid_now = Math.max(0, roundMoney(input.amountPaidNow || 0));
    }

    if (input.notes) {
      rpcParams.p_notes = input.notes;
    }

    // Call the RPC function
    const { data, error } = await supabase.rpc('create_sale', rpcParams);

    if (error) {
      throw new Error(error.message || 'Failed to create sale');
    }

    if (!data) {
      throw new Error('Failed to create sale');
    }

    // The RPC returns the sale as JSON
    const saleData = data as any;
    return {
      id: saleData.id,
      receipt_number: saleData.receipt_number,
      customer_id: saleData.customer_id,
      customer_name: saleData.customer_name,
      total_amount: Number(saleData.total_amount),
      discount_amount: Number(saleData.discount_amount),
      payment_method: saleData.payment_method,
      amount_received: Number(saleData.amount_received),
      amount_paid_now: Number(saleData.amount_paid_now),
      change_given: Number(saleData.change_given),
      outstanding_credit: Number(saleData.outstanding_credit),
      notes: saleData.notes,
      created_at: saleData.created_at,
      items: (saleData.items || []).map((item: any) => ({
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        product_name: item.product_name,
        category: item.category,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
      })),
    };
  }

  async getDashboardStats(): Promise<{
    todaySalesAmount: number;
    todayTransactionsCount: number;
    todayCreditGiven: number;
    totalOutstandingCredit: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Get today's sales
    const { data: todaySales, error: salesError } = await supabase
      .from('sales')
      .select('total_amount, payment_method, outstanding_credit')
      .gte('created_at', todayStart);

    if (salesError) throw salesError;

    const todaySalesAmount = (todaySales || []).reduce((acc, s) => roundMoney(acc + Number(s.total_amount)), 0);
    const todayTransactionsCount = (todaySales || []).length;
    const todayCreditGiven = (todaySales || [])
      .filter((s) => s.payment_method === 'CREDIT')
      .reduce((acc, s) => roundMoney(acc + Number(s.outstanding_credit)), 0);

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
      todaySalesAmount: roundMoney(todaySalesAmount),
      todayTransactionsCount,
      todayCreditGiven: roundMoney(todayCreditGiven),
      totalOutstandingCredit: roundMoney(totalOutstandingCredit),
    };
  }
}

export const salesService = new SalesService();
