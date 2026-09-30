import { CreditTransaction } from '../types';
import { supabase } from './supabaseClient';
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

    // Call the RPC function
    const { data, error } = await supabase.rpc('record_payment', {
      p_customer_id: input.customerId,
      p_amount: roundedAmount,
      p_reference: 'Cash Payment',
      p_notes: input.notes?.trim() || null,
    });

    if (error) {
      throw new Error(error.message || 'Failed to record payment');
    }

    if (!data) {
      throw new Error('Failed to record payment');
    }

    // The RPC returns the transaction as JSON
    const txData = data as any;
    const transaction: CreditTransaction = {
      id: txData.id,
      customer_id: txData.customer_id,
      sale_id: txData.sale_id,
      type: txData.type,
      amount: Number(txData.amount),
      balance_after: Number(txData.balance_after),
      payment_method: txData.payment_method,
      reference: txData.reference,
      notes: txData.notes,
      created_at: txData.created_at,
    };

    // Get updated balance from customers_view
    const { data: customerData } = await supabase
      .from('customers_view')
      .select('outstanding_balance')
      .eq('id', input.customerId)
      .single();

    const newBalance = customerData ? Number(customerData.outstanding_balance) : Number(txData.balance_after);

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

    // Call the RPC function
    const { data, error } = await supabase.rpc('add_credit_purchase', {
      p_customer_id: input.customerId,
      p_amount: roundedAmount,
      p_description: input.description.trim() || 'Parts taken on credit',
      p_reference: input.reference?.trim() || 'Credit Purchase',
      p_date: input.date ? new Date(input.date).toISOString() : undefined,
    });

    if (error) {
      throw new Error(error.message || 'Failed to add credit purchase');
    }

    if (!data) {
      throw new Error('Failed to add credit purchase');
    }

    // The RPC returns the transaction as JSON
    const txData = data as any;
    const transaction: CreditTransaction = {
      id: txData.id,
      customer_id: txData.customer_id,
      sale_id: txData.sale_id,
      type: txData.type,
      amount: Number(txData.amount),
      balance_after: Number(txData.balance_after),
      payment_method: txData.payment_method,
      reference: txData.reference,
      notes: txData.notes,
      created_at: txData.created_at,
    };

    // Get updated balance from customers_view
    const { data: customerData } = await supabase
      .from('customers_view')
      .select('outstanding_balance')
      .eq('id', input.customerId)
      .single();

    const newBalance = customerData ? Number(customerData.outstanding_balance) : Number(txData.balance_after);

    return {
      transaction,
      newBalance,
    };
  }

  async getCustomerTransactions(customerId: string): Promise<CreditTransaction[]> {
    const { data, error } = await supabase
      .from('credit_transactions_view')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((tx: any) => ({
      id: tx.id,
      customer_id: tx.customer_id,
      sale_id: tx.sale_id,
      type: tx.type,
      amount: Number(tx.amount),
      balance_after: Number(tx.balance_after),
      payment_method: tx.payment_method,
      reference: tx.reference,
      notes: tx.notes,
      created_at: tx.created_at,
    }));
  }
}

export const paymentService = new PaymentService();
