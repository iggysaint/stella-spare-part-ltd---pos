import React, { useState, useEffect } from 'react';
import { PaymentMethod, Customer } from '../../types';
import { formatCedi, calculateChange, parseCediInput, roundMoney } from '../../utils/currency';
import { customerService } from '../../services/customerService';
import { ConfirmAmountModal } from '../common/ConfirmAmountModal';
import { 
  Banknote, 
  CreditCard, 
  UserPlus, 
  Search, 
  X, 
  Check, 
  AlertCircle,
  Phone
} from 'lucide-react';

interface CheckoutModalProps {
  totalAmount: number;
  discountAmount: number;
  onClose: () => void;
  onComplete: (data: {
    paymentMethod: PaymentMethod;
    amountReceived?: number;
    customerId?: string;
    amountPaidNow?: number;
    notes?: string;
  }) => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  totalAmount,
  onClose,
  onComplete,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  const roundedTotal = roundMoney(totalAmount);

  // Cash state
  const [receivedInput, setReceivedInput] = useState<string>(roundedTotal.toFixed(2));

  // Credit state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [paidNowInput, setPaidNowInput] = useState<string>('0.00');
  const [creditNotes, setCreditNotes] = useState<string>('');

  // New Customer inline form
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState<number>(roundedTotal);

  // Submitting state & error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load customers for credit
  useEffect(() => {
    customerService.getCustomers().then(setCustomers);
  }, []);

  // Quick cash additions
  const numericReceived = roundMoney(parseCediInput(receivedInput));
  const changeAmount = calculateChange(numericReceived, roundedTotal);
  const isCashInsufficient = roundMoney(numericReceived) < roundMoney(roundedTotal);

  // Credit calculations
  const numericPaidNow = roundMoney(parseCediInput(paidNowInput));
  const outstandingCredit = Math.max(0, roundMoney(roundedTotal - numericPaidNow));
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleMoneyInputChange = (val: string, setter: (v: string) => void) => {
    if (val === '' || /^\d*(\.\d{0,2})?$/.test(val)) {
      setter(val);
    }
  };

  const handleQuickCash = (amount: number) => {
    setReceivedInput(roundMoney(amount).toFixed(2));
  };

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      setErrorMessage('Please enter the customer name');
      return;
    }
    try {
      const created = await customerService.addCustomer({
        name: newCustName,
        phone: newCustPhone || 'No Phone',
        notes: newCustNotes,
      });
      setCustomers((prev) => [created, ...prev]);
      setSelectedCustomerId(created.id);
      setIsAddingCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustNotes('');
      setErrorMessage(null);
    } catch {
      setErrorMessage('Could not save customer. Try again.');
    }
  };

  // Called when user clicks "COMPLETE SALE" / "SAVE CREDIT SALE" -> triggers confirmation modal
  const handleInitiateSubmit = () => {
    setErrorMessage(null);

    if (paymentMethod === 'CASH') {
      if (roundMoney(numericReceived) < roundMoney(roundedTotal)) {
        setErrorMessage(
          `Amount received (${formatCedi(numericReceived)}) is less than total (${formatCedi(roundedTotal)})`
        );
        return;
      }
      setConfirmAmount(roundedTotal);
      setShowConfirmModal(true);
    } else if (paymentMethod === 'CREDIT') {
      if (!selectedCustomerId) {
        setErrorMessage('Please select a customer for credit sale');
        return;
      }
      if (roundMoney(numericPaidNow) > roundMoney(roundedTotal)) {
        setErrorMessage('Amount paid now cannot be greater than the total amount.');
        return;
      }
      setConfirmAmount(roundedTotal);
      setShowConfirmModal(true);
    }
  };

  // Called when user clicks "Yes, save" in the confirmation dialog
  const handleConfirmedSave = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      if (paymentMethod === 'CASH') {
        await onComplete({
          paymentMethod: 'CASH',
          amountReceived: numericReceived,
        });
      } else if (paymentMethod === 'CREDIT') {
        await onComplete({
          paymentMethod: 'CREDIT',
          customerId: selectedCustomerId,
          amountPaidNow: numericPaidNow,
          notes: creditNotes.trim() || undefined,
        });
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'Sale could not be completed. Please try again.');
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <div 
          className="w-full max-w-xl bg-surface rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[92vh] border border-border animate-in fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Total */}
          <div className="bg-surface-muted text-primary p-5 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary">Checkout</span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-secondary hover:text-primary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <p className="text-xs text-secondary font-medium">Total to Pay</p>
                <h2 className="text-3xl sm:text-4xl font-black text-primary">
                  {formatCedi(roundedTotal)}
                </h2>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-accent-soft text-accent border border-border">
                  {paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector: CASH and CREDIT only */}
          <div className="p-4 sm:p-5 pb-3 bg-surface border-b border-border">
            <label className="block text-xs font-semibold text-secondary mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CASH');
                  setErrorMessage(null);
                }}
                className={`p-4 rounded-lg flex flex-col items-center justify-center gap-2 font-bold transition border ${
                  paymentMethod === 'CASH'
                    ? 'border-positive bg-positive-soft text-positive ring-2 ring-positive'
                    : 'border-border bg-surface-muted hover:bg-surface text-secondary'
                }`}
              >
                <Banknote className="w-6 h-6 text-positive" />
                <span className="text-base font-black">CASH</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CREDIT');
                  setErrorMessage(null);
                }}
                className={`p-4 rounded-lg flex flex-col items-center justify-center gap-2 font-bold transition border ${
                  paymentMethod === 'CREDIT'
                    ? 'border-warning bg-surface-muted text-warning ring-2 ring-warning'
                    : 'border-border bg-surface-muted hover:bg-surface text-secondary'
                }`}
              >
                <CreditCard className="w-6 h-6 text-warning" />
                <span className="text-base font-black">CREDIT</span>
              </button>
            </div>
          </div>

          {/* Payment Method Details Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            
            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-danger/10 border border-danger text-danger flex items-start gap-2.5 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Notice:</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* CASH MODE */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1.5">
                    Amount Received from Customer (GH₵)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-secondary text-base">
                      GH₵
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={receivedInput}
                      onChange={(e) => handleMoneyInputChange(e.target.value, setReceivedInput)}
                      className="w-full pl-16 pr-4 py-3 rounded-lg border border-border bg-surface text-xl font-black text-primary outline-hidden focus:border-accent"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick Cash Buttons */}
                <div>
                  <p className="text-xs text-secondary mb-2 font-medium">Quick Amount Presets:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickCash(roundedTotal)}
                      className="px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface text-xs font-bold text-primary transition border border-border"
                    >
                      Exact: {formatCedi(roundedTotal)}
                    </button>
                    {[
                      Math.ceil(roundedTotal / 50) * 50,
                      Math.ceil(roundedTotal / 100) * 100,
                      Math.ceil((roundedTotal + 50) / 100) * 100,
                    ]
                      .filter((val, i, arr) => val > roundedTotal && arr.indexOf(val) === i)
                      .slice(0, 3)
                      .map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleQuickCash(val)}
                          className="px-3 py-1.5 rounded-lg bg-positive-soft hover:opacity-90 text-xs font-bold text-positive transition border border-positive"
                        >
                          {formatCedi(val)}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Cash Summary Banner */}
                <div className="p-4 rounded-lg bg-surface-muted border border-border space-y-2">
                  <div className="flex justify-between text-sm text-secondary">
                    <span>Total Due:</span>
                    <span className="font-bold text-primary">{formatCedi(roundedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-secondary">
                    <span>Amount Received:</span>
                    <span className="font-bold text-primary">{formatCedi(numericReceived)}</span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between items-baseline">
                    <span className="font-bold text-primary">
                      {isCashInsufficient ? 'Amount Still Due:' : 'Change to Customer:'}
                    </span>
                    <span
                      className={`text-xl font-black ${
                        isCashInsufficient ? 'text-danger' : 'text-positive'
                      }`}
                    >
                      {isCashInsufficient
                        ? formatCedi(Math.max(0, roundMoney(roundedTotal - numericReceived)))
                        : formatCedi(changeAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CREDIT MODE */}
            {paymentMethod === 'CREDIT' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-surface-muted border border-border text-primary text-sm">
                  <p className="font-bold text-warning">Credit Sale / Buy on Book</p>
                  <p className="text-xs text-secondary mt-1">
                    Select the customer account. You can optionally record a partial deposit now.
                  </p>
                </div>

                {/* Customer Picker */}
                {!isAddingCustomer ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-secondary">
                        Select Customer Account <span className="text-danger">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomer(true)}
                        className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ New Customer</span>
                      </button>
                    </div>

                    {/* Customer search filter */}
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search customer by name or phone..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface text-primary outline-hidden focus:border-accent"
                      />
                    </div>

                    {/* Customer list */}
                    <div className="max-h-40 overflow-y-auto space-y-1.5 border border-border rounded-lg p-1.5 bg-surface-muted">
                      {filteredCustomers.length === 0 ? (
                        <div className="text-center py-4 text-xs text-secondary">
                          No customer found. Tap <strong>+ New Customer</strong> to add one.
                        </div>
                      ) : (
                        filteredCustomers.map((c) => {
                          const isSelected = c.id === selectedCustomerId;
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCustomerId(c.id)}
                              className={`p-2.5 rounded-lg cursor-pointer border transition flex items-center justify-between ${
                                isSelected
                                  ? 'bg-accent text-surface border-accent'
                                  : 'bg-surface hover:bg-surface-muted border-border text-primary'
                              }`}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="font-bold text-xs truncate">{c.name}</p>
                                <p className={`text-[11px] ${isSelected ? 'text-surface/80' : 'text-secondary'}`}>
                                  {c.phone}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span
                                  className={`text-[11px] font-bold block ${
                                    isSelected
                                      ? 'text-surface'
                                      : c.outstanding_balance > 0
                                      ? 'text-danger'
                                      : 'text-positive'
                                  }`}
                                >
                                  Owes: {formatCedi(c.outstanding_balance)}
                                </span>
                                {isSelected && <Check className="w-4 h-4 ml-auto text-surface mt-0.5" />}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  /* Inline Add Customer Form */
                  <div className="p-3.5 rounded-lg bg-surface-muted border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-primary">
                        Add New Customer Account
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomer(false)}
                        className="text-xs text-secondary hover:text-primary"
                      >
                        Cancel
                      </button>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Customer Name (e.g. Kofi Mensah - Sprinter)"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-primary outline-hidden focus:border-accent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="w-3.5 h-3.5 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Phone Number (e.g. 024 123 4567)"
                          value={newCustPhone}
                          onChange={(e) => setNewCustPhone(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-surface text-primary outline-hidden focus:border-accent"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomerSubmit}
                      className="w-full py-2 bg-accent hover:bg-accent-hover text-surface rounded-lg text-xs font-bold transition"
                    >
                      Save & Select Customer
                    </button>
                  </div>
                )}

                {/* Amount paid now */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      Amount Paid Now (GH₵)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paidNowInput}
                      onChange={(e) => handleMoneyInputChange(e.target.value, setPaidNowInput)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-base font-bold text-primary outline-hidden focus:border-accent"
                    />
                    <p className="text-[10px] text-secondary mt-1">Enter 0 if paying nothing today</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      Remaining Credit Balance
                    </label>
                    <div className="px-3 py-2.5 rounded-lg bg-surface-muted border border-border">
                      <span className="text-base font-black text-danger block">
                        {formatCedi(outstandingCredit)}
                      </span>
                      <span className="text-[10px] text-secondary">Added to customer debt</span>
                    </div>
                  </div>
                </div>

                {/* Credit Notes */}
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Agreement Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={creditNotes}
                    onChange={(e) => setCreditNotes(e.target.value)}
                    placeholder="e.g. promised to settle Friday evening"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-primary outline-hidden focus:border-accent"
                  />
                </div>

                {selectedCustomer && (
                  <div className="text-xs text-secondary p-2.5 rounded-lg bg-surface-muted border border-border flex justify-between">
                    <span>Selected: <strong className="text-primary">{selectedCustomer.name}</strong></span>
                    <span>Previous debt: <strong className="text-danger">{formatCedi(selectedCustomer.outstanding_balance)}</strong></span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-surface-muted border-t border-border flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-lg border border-border bg-surface hover:bg-surface-muted text-secondary font-bold text-sm transition"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleInitiateSubmit}
              disabled={isSubmitting || (paymentMethod === 'CASH' && isCashInsufficient)}
              className={`flex-1 py-3.5 rounded-lg font-bold text-base transition flex items-center justify-center gap-2 ${
                paymentMethod === 'CASH'
                  ? 'bg-positive hover:opacity-90 text-surface'
                  : 'bg-accent hover:bg-accent-hover text-surface'
              } ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isSubmitting ? (
                <span>Saving Sale...</span>
              ) : paymentMethod === 'CREDIT' ? (
                <span>SAVE CREDIT SALE</span>
              ) : (
                <span>COMPLETE CASH SALE</span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Confirmation Dialog before saving sale */}
      <ConfirmAmountModal
        isOpen={showConfirmModal}
        amount={confirmAmount}
        title="Is this amount correct?"
        description={
          paymentMethod === 'CASH'
            ? 'Total cash sale amount to be recorded'
            : `Credit sale amount to be charged to ${selectedCustomer?.name || 'customer'}`
        }
        confirmLabel="Yes, save"
        cancelLabel="No, go back"
        onConfirm={handleConfirmedSave}
        onCancel={() => setShowConfirmModal(false)}
        isLoading={isSubmitting}
      />
    </>
  );
};
