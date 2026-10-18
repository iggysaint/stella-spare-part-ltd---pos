import { Customer } from '../types';
import { supabase } from './supabaseClient';
import { fuzzyMatch } from '../utils/fuzzySearch';
import { roundMoney } from '../utils/currency';

class CustomerService {
  async getCustomers(searchQuery?: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers_view')
      .select('*');

    if (error) throw error;

    let list = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      notes: c.notes,
      outstanding_balance: Number(c.outstanding_balance),
      created_at: c.created_at,
    }));

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim();
      list = list.filter((c) => {
        const text = `${c.name} ${c.phone} ${c.notes || ''}`;
        return fuzzyMatch(q, text);
      });
    }

    // Sort by outstanding balance descending (highest debtor first), then name
    return list.sort((a, b) => {
      if (b.outstanding_balance !== a.outstanding_balance) {
        return b.outstanding_balance - a.outstanding_balance;
      }
      return a.name.localeCompare(b.name);
    });
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      notes: data.notes,
      outstanding_balance: Number(data.outstanding_balance),
      created_at: data.created_at,
    };
  }

  async addCustomer(data: { name: string; phone: string; notes?: string }): Promise<Customer> {
    const { data: result, error } = await supabase
      .from('customers')
      .insert({
        name: data.name.trim(),
        phone: data.phone.trim(),
        notes: data.notes?.trim() || '',
      })
      .select()
      .single();

    if (error) throw error;
    if (!result) throw new Error('Failed to create customer');

    return {
      id: result.id,
      name: result.name,
      phone: result.phone,
      notes: result.notes,
      outstanding_balance: 0,
      created_at: result.created_at,
    };
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.notes !== undefined) updateData.notes = data.notes;
    // outstanding_balance is computed, don't update it directly

    const { data: result, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Customer not found');
    if (!result) throw new Error('Customer not found');

    // Fetch from view to get computed balance
    const { data: viewData, error: viewError } = await supabase
      .from('customers_view')
      .select('*')
      .eq('id', id)
      .single();

    if (viewError) throw viewError;
    if (!viewData) throw new Error('Customer not found');

    return {
      id: viewData.id,
      name: viewData.name,
      phone: viewData.phone,
      notes: viewData.notes,
      outstanding_balance: Number(viewData.outstanding_balance),
      created_at: viewData.created_at,
    };
  }

  async adjustBalance(customerId: string, delta: number): Promise<number> {
    // This function is kept for backward compatibility but should use RPC functions
    // For positive delta (increase debt), use add_credit_purchase
    // For negative delta (decrease debt/pay), use record_payment
    // Since this is a direct balance adjustment without context, we'll recalculate from view
    const { data, error } = await supabase
      .from('customers_view')
      .select('outstanding_balance')
      .eq('id', customerId)
      .single();

    if (error) throw new Error('Customer not found');
    if (!data) throw new Error('Customer not found');

    // This is a legacy function - in practice, use paymentService for actual balance changes
    // For now, we'll just return the current balance since direct balance manipulation
    // should go through proper credit transaction RPCs
    return Number(data.outstanding_balance);
  }

  async recalculateBalance(customerId: string): Promise<number> {
    // The customers_view already has the computed outstanding_balance
    const { data, error } = await supabase
      .from('customers_view')
      .select('outstanding_balance')
      .eq('id', customerId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Customer not found');

    return Number(data.outstanding_balance);
  }
}

export const customerService = new CustomerService();
