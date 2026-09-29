import { Sale, CartItem, PaymentMethod, SaleItem, CreditTransaction } from '../types';
import { storage } from './storage';
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
    let list = storage.getSales();

    if (filter?.period) {
      if (filter.period === 'today') {
        list = list.filter((s) => isToday(s.created_at));
      } else if (filter.period === 'week') {
        list = list.filter((s) => isThisWeek(s.created_at));
      } else if (filter.period === 'month') {
        list = list.filter((s) => isThisMonth(s.created_at));
      }
    }

    if (filter?.paymentMethod && filter.paymentMethod !== 'ALL') {
      list = list.filter((s) => s.payment_method === filter.paymentMethod);
    }

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

    // Sort newest first
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getSaleById(id: string): Promise<Sale | null> {
    const list = storage.getSales();
    return list.find((s) => s.id === id) || null;
  }

  async createSale(input: CreateSaleInput): Promise<Sale> {
    if (!input.items || input.items.length === 0) {
      throw new Error('Your cart is empty. Add parts before checkout.');
    }

    // 1. Verify stock availability for all items
    const allProducts = storage.getProducts();
    for (const item of input.items) {
      const liveProduct = allProducts.find((p) => p.id === item.product.id);
      if (!liveProduct) {
        throw new Error(`Part "${item.product.name}" is no longer in inventory.`);
      }
      if (item.quantity > liveProduct.stock_quantity) {
        throw new Error(
          `Not enough stock for ${item.product.name}. Only ${liveProduct.stock_quantity} available.`
        );
      }
    }

    // 2. Calculate totals using roundMoney
    const grossTotal = input.items.reduce((sum, i) => roundMoney(sum + roundMoney(i.total_price)), 0);
    const discount = Math.max(0, roundMoney(input.discountAmount || 0));
    const netTotal = Math.max(0, roundMoney(grossTotal - discount));

    // 3. Process payment method specifics
    let amountReceived = 0;
    let changeGiven = 0;
    let outstandingCredit = 0;
    let amountPaidNow = 0;
    let customerName: string | null = null;

    if (input.paymentMethod === 'CASH') {
      amountReceived = roundMoney(input.amountReceived ?? netTotal);
      if (roundMoney(amountReceived) < roundMoney(netTotal)) {
        throw new Error('Amount received cannot be less than the total sale amount.');
      }
      changeGiven = Math.max(0, roundMoney(amountReceived - netTotal));
      amountPaidNow = netTotal;
    } else if (input.paymentMethod === 'CREDIT') {
      if (!input.customerId) {
        throw new Error('Please select a customer for credit sale.');
      }
      const customer = await customerService.getCustomerById(input.customerId);
      if (!customer) {
        throw new Error('Selected customer account not found.');
      }
      customerName = customer.name;

      amountPaidNow = Math.max(0, roundMoney(input.amountPaidNow || 0));
      if (roundMoney(amountPaidNow) > roundMoney(netTotal)) {
        throw new Error('Amount paid now cannot exceed the sale total.');
      }

      outstandingCredit = Math.max(0, roundMoney(netTotal - amountPaidNow));
      amountReceived = amountPaidNow;
    }

    // 4. Generate next receipt number
    const receiptNumber = storage.getNextReceiptNumber();
    const saleId = `sale_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // 5. Construct sale items
    const saleItems: SaleItem[] = input.items.map((cartItem, idx) => ({
      id: `sitem_${saleId}_${idx + 1}`,
      sale_id: saleId,
      product_id: cartItem.product.id,
      product_name: cartItem.product.name,
      category: cartItem.product.category,
      quantity: cartItem.quantity,
      unit_price: roundMoney(cartItem.unit_price),
      total_price: roundMoney(cartItem.quantity * cartItem.unit_price),
    }));

    const newSale: Sale = {
      id: saleId,
      receipt_number: receiptNumber,
      customer_id: input.customerId || null,
      customer_name: customerName,
      total_amount: netTotal,
      discount_amount: discount,
      payment_method: input.paymentMethod,
      amount_received: amountReceived,
      amount_paid_now: amountPaidNow,
      change_given: changeGiven,
      outstanding_credit: outstandingCredit,
      notes: input.notes || '',
      created_at: timestamp,
      items: saleItems,
    };

    // 6. Deduct inventory
    await productService.deductStock(
      input.items.map((i) => ({ productId: i.product.id, quantity: i.quantity }))
    );

    // 7. Update credit records if applicable
    if (input.paymentMethod === 'CREDIT' && input.customerId && outstandingCredit > 0) {
      const newBal = await customerService.adjustBalance(input.customerId, outstandingCredit);

      // Record credit transaction
      const ctxs = storage.getCreditTransactions();
      const creditTx: CreditTransaction = {
        id: `ctx_${Date.now()}`,
        customer_id: input.customerId,
        sale_id: saleId,
        type: 'CREDIT_SALE',
        amount: outstandingCredit,
        balance_after: newBal,
        payment_method: null,
        reference: receiptNumber,
        notes: amountPaidNow > 0 ? `Partial payment of GH₵${amountPaidNow.toFixed(2)} made at checkout` : 'Full sale on credit',
        created_at: timestamp,
      };
      ctxs.push(creditTx);
      storage.saveCreditTransactions(ctxs);
    }

    // 8. Save sale record
    const allSales = storage.getSales();
    allSales.unshift(newSale);
    storage.saveSales(allSales);

    return newSale;
  }

  async getDashboardStats(): Promise<{
    todaySalesAmount: number;
    todayTransactionsCount: number;
    todayCreditGiven: number;
    totalOutstandingCredit: number;
  }> {
    const allSales = storage.getSales();
    const allCustomers = storage.getCustomers();

    const todaySales = allSales.filter((s) => isToday(s.created_at));
    const todaySalesAmount = todaySales.reduce((acc, s) => roundMoney(acc + s.total_amount), 0);
    const todayTransactionsCount = todaySales.length;

    // Credit given today (sum of outstanding credit on today's credit sales)
    const todayCreditGiven = todaySales
      .filter((s) => s.payment_method === 'CREDIT')
      .reduce((acc, s) => roundMoney(acc + s.outstanding_credit), 0);

    // Total outstanding credit across all customer accounts
    const totalOutstandingCredit = allCustomers.reduce(
      (acc, c) => roundMoney(acc + (c.outstanding_balance || 0)),
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
