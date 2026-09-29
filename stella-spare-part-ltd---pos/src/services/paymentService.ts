import { CreditTransaction } from '../types';
import { storage } from './storage';
import { customerService } from './customerService';
import { roundMoney } from '../utils/currency';

export interface RecordPaymentInput {
  customerId: string;
  amount: number;
  notes?: string;
}

export interface AddCreditPurchaseInput {
  customerId: string;
  amount: number;
  description: string;
  reference?: string;
  date?: string;
}

class PaymentService {
  async recordPayment(input: RecordPaymentInput): Promise<{
    transaction: CreditTransaction;
    newBalance: number;
  }> {
    const customer = await customerService.getCustomerById(input.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const roundedAmount = roundMoney(input.amount);
    if (!roundedAmount || roundedAmount <= 0) {
      throw new Error('Enter a valid payment amount');
    }

    if (roundedAmount > roundMoney(customer.outstanding_balance)) {
      throw new Error(
        `Payment cannot be greater than the outstanding balance of GH₵${customer.outstanding_balance.toFixed(2)}.`
      );
    }

    const timestamp = new Date().toISOString();
    const transaction: CreditTransaction = {
      id: `ctx_pay_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      customer_id: customer.id,
      sale_id: null,
      type: 'PAYMENT',
      amount: roundedAmount,
      balance_after: 0,
      payment_method: 'CASH',
      reference: 'Cash Payment',
      notes: input.notes?.trim() || null,
      created_at: timestamp,
    };

    const allTx = storage.getCreditTransactions();
    allTx.push(transaction);
    storage.saveCreditTransactions(allTx);

    const newBalance = await customerService.recalculateBalance(customer.id);
    transaction.balance_after = newBalance;
    storage.saveCreditTransactions(allTx);

    return {
      transaction,
      newBalance,
    };
  }

  async addCreditPurchase(input: AddCreditPurchaseInput): Promise<{
    transaction: CreditTransaction;
    newBalance: number;
  }> {
    const customer = await customerService.getCustomerById(input.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const roundedAmount = roundMoney(input.amount);
    if (!roundedAmount || roundedAmount <= 0) {
      throw new Error('Enter a valid credit amount');
    }

    const timestamp = input.date ? new Date(input.date).toISOString() : new Date().toISOString();
    const transaction: CreditTransaction = {
      id: `ctx_cred_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      customer_id: customer.id,
      sale_id: null,
      type: 'CREDIT_SALE',
      amount: roundedAmount,
      balance_after: 0,
      payment_method: null,
      reference: input.reference?.trim() || 'Credit Purchase',
      notes: input.description.trim() || 'Parts taken on credit',
      created_at: timestamp,
    };

    const allTx = storage.getCreditTransactions();
    allTx.push(transaction);
    storage.saveCreditTransactions(allTx);

    const newBalance = await customerService.recalculateBalance(customer.id);
    transaction.balance_after = newBalance;
    storage.saveCreditTransactions(allTx);

    return {
      transaction,
      newBalance,
    };
  }

  async getCustomerTransactions(customerId: string): Promise<CreditTransaction[]> {
    const all = storage.getCreditTransactions();
    return all
      .filter((t) => t.customer_id === customerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export const paymentService = new PaymentService();
