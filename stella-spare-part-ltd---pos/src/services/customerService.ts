import { Customer } from '../types';
import { storage } from './storage';
import { fuzzyMatch } from '../utils/fuzzySearch';
import { roundMoney } from '../utils/currency';

class CustomerService {
  async getCustomers(searchQuery?: string): Promise<Customer[]> {
    let list = storage.getCustomers();

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
    const list = storage.getCustomers();
    return list.find((c) => c.id === id) || null;
  }

  async addCustomer(data: { name: string; phone: string; notes?: string }): Promise<Customer> {
    const list = storage.getCustomers();
    const newCustomer: Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      notes: data.notes?.trim() || '',
      outstanding_balance: 0,
      created_at: new Date().toISOString(),
    };
    list.push(newCustomer);
    storage.saveCustomers(list);
    return newCustomer;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const list = storage.getCustomers();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }
    const updated = {
      ...list[index],
      ...data,
      ...(data.outstanding_balance !== undefined
        ? { outstanding_balance: roundMoney(data.outstanding_balance) }
        : {}),
    };
    list[index] = updated;
    storage.saveCustomers(list);
    return updated;
  }

  async adjustBalance(customerId: string, delta: number): Promise<number> {
    const list = storage.getCustomers();
    const index = list.findIndex((c) => c.id === customerId);
    if (index === -1) {
      throw new Error('Customer not found');
    }
    const current = list[index].outstanding_balance;
    const newBal = Math.max(0, current + delta);
    list[index].outstanding_balance = roundMoney(newBal);
    storage.saveCustomers(list);
    return list[index].outstanding_balance;
  }

  async recalculateBalance(customerId: string): Promise<number> {
    const allTx = storage.getCreditTransactions().filter((t) => t.customer_id === customerId);
    const credits = allTx
      .filter((t) => t.type === 'CREDIT_SALE')
      .reduce((sum, t) => roundMoney(sum + (Number(t.amount) || 0)), 0);
    const payments = allTx
      .filter((t) => t.type === 'PAYMENT')
      .reduce((sum, t) => roundMoney(sum + (Number(t.amount) || 0)), 0);

    const calculatedBalance = Math.max(0, roundMoney(credits - payments));

    const list = storage.getCustomers();
    const index = list.findIndex((c) => c.id === customerId);
    if (index !== -1) {
      list[index].outstanding_balance = calculatedBalance;
      storage.saveCustomers(list);
    }
    return calculatedBalance;
  }
}

export const customerService = new CustomerService();
