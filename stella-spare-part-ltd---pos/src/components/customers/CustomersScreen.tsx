import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { customerService } from '../../services/customerService';
import { formatCedi, roundMoney } from '../../utils/currency';
import { CustomerDetailModal } from './CustomerDetailModal';
import { 
  UserPlus, 
  Search, 
  Users, 
  Phone, 
  X, 
  AlertCircle,
  FileText,
  ChevronRight
} from 'lucide-react';

interface CustomersScreenProps {
  initialOpenAddCustomer?: boolean;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  initialOpenAddCustomer = false,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected customer for modal
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Add Customer modal
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(initialOpenAddCustomer);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const list = await customerService.getCustomers(searchQuery);
      setCustomers(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [searchQuery]);

  useEffect(() => {
    if (initialOpenAddCustomer) {
      setName('');
      setPhone('');
      setNotes('');
      setFormError(null);
      setIsAddCustomerModalOpen(true);
    }
  }, [initialOpenAddCustomer]);

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter the customer name');
      return;
    }

    try {
      const created = await customerService.addCustomer({
        name: name.trim(),
        phone: phone.trim() || 'No Phone',
        notes: notes.trim(),
      });

      setIsAddCustomerModalOpen(false);
      setName('');
      setPhone('');
      setNotes('');
      await loadCustomers();
      setActiveCustomer(created);
    } catch {
      setFormError('Failed to save customer account.');
    }
  };

  // Only customers who owe money
  const debtors = customers.filter((c) => roundMoney(c.outstanding_balance) > 0);

  // Total outstanding credit across all customers
  const totalOutstanding = roundMoney(
    customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0)
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      
      {/* Top Banner: Total Outstanding & Add Customer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-lg border border-border">
        <div>
          <span className="text-xs font-semibold text-secondary block">
            Total Outstanding Credit Book
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-danger tracking-tight mt-1">
            {formatCedi(totalOutstanding)}
          </h1>
          <p className="text-xs text-secondary mt-1">
            {debtors.length} {debtors.length === 1 ? 'customer owes' : 'customers owe'} money on credit
          </p>
        </div>

        <div>
          <button
            onClick={() => {
              setName('');
              setPhone('');
              setNotes('');
              setFormError(null);
              setIsAddCustomerModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-sm flex items-center justify-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customer by name or phone number..."
          className="w-full pl-11 pr-4 py-3 bg-surface rounded-lg border border-border text-primary placeholder:text-secondary text-sm font-medium outline-hidden focus:border-accent"
        />
      </div>

      {/* Simple Credit List */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-surface-muted rounded-lg border border-border animate-pulse" />
            ))}
          </div>
        ) : debtors.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Users className="w-12 h-12 text-secondary opacity-40 mx-auto" />
            <div>
              <h3 className="font-bold text-base text-primary">No credit records</h3>
              <p className="text-xs text-secondary mt-1">
                {searchQuery
                  ? `No debtor found matching "${searchQuery}".`
                  : 'All customer credit accounts are fully cleared or none created yet.'}
              </p>
            </div>
            <button
              onClick={() => setIsAddCustomerModalOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-xs inline-flex items-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Customer</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {debtors.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveCustomer(c)}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-surface-muted cursor-pointer transition select-none"
              >
                {/* Customer Name */}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base sm:text-lg text-primary truncate">
                    {c.name}
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">
                    {c.phone || 'No phone recorded'}
                  </p>
                </div>

                {/* Amount Owed in large, easy-to-read text */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-black text-xl sm:text-2xl text-danger block">
                      {formatCedi(c.outstanding_balance)}
                    </span>
                    <span className="text-[11px] text-secondary">owed</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-secondary opacity-50" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Detail Popup */}
      {activeCustomer && (
        <CustomerDetailModal
          customer={activeCustomer}
          onClose={() => setActiveCustomer(null)}
          onUpdate={loadCustomers}
        />
      )}

      {/* Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-md bg-surface rounded-lg shadow-xl overflow-hidden border border-border animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-surface-muted p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-primary">New Customer Account</h3>
                <p className="text-xs text-secondary">Register a customer for credit sales</p>
              </div>
              <button
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-primary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="p-4 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-danger/10 border border-danger text-danger text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Customer Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kwabena Boateng (Sprinter driver)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-muted border border-border rounded-lg text-primary text-sm outline-hidden focus:border-accent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. 024 456 7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-surface-muted border border-border rounded-lg text-primary text-sm outline-hidden focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Vehicle / Counter Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Trotro station park 2, yellow Mercedes Sprinter"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-primary text-xs outline-hidden focus:border-accent"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-secondary font-bold text-xs hover:bg-surface-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-xs transition"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
