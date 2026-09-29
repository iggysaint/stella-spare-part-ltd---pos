import React, { useState, useEffect } from 'react';
import { Customer, CreditTransaction } from '../../types';
import { paymentService } from '../../services/paymentService';
import { formatCedi, parseCediInput, roundMoney } from '../../utils/currency';
import { formatReceiptDate } from '../../utils/date';
import { ConfirmAmountModal } from '../common/ConfirmAmountModal';
import { 
  X, 
  Banknote, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  PlusCircle,
  Receipt,
  FileText
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer;
  initialMode?: 'none' | 'payment' | 'add_credit';
  onClose: () => void;
  onUpdate: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  initialMode = 'none',
  onClose,
  onUpdate,
}) => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState(customer.outstanding_balance);
  const [isLoading, setIsLoading] = useState(true);

  // Form Mode: none | 'payment' | 'add_credit'
  const [activeForm, setActiveForm] = useState<'none' | 'payment' | 'add_credit'>(initialMode);

  // Record Payment fields (Cash only)
  const [paymentAmount, setPaymentAmount] = useState(
    initialMode === 'payment' && customer.outstanding_balance > 0 ? customer.outstanding_balance.toFixed(2) : ''
  );
  const [paymentNotes, setPaymentNotes] = useState('');

  // Add Credit Purchase fields
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingConfirmType, setPendingConfirmType] = useState<'payment' | 'credit'>('payment');
  const [confirmAmount, setConfirmAmount] = useState(0);

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const txs = await paymentService.getCustomerTransactions(customer.id);
      setTransactions(txs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [customer.id]);

  const handleMoneyInputChange = (val: string, setter: (v: string) => void) => {
    if (val === '' || /^\d*(\.\d{0,2})?$/.test(val)) {
      setter(val);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Calculate summary stats
  const totalCredit = roundMoney(
    transactions
      .filter((t) => t.type === 'CREDIT_SALE')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  );

  const totalPaid = roundMoney(
    transactions
      .filter((t) => t.type === 'PAYMENT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  );

  // 1. Initiate Record Payment (Triggers confirmation dialog)
  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amount = roundMoney(parseCediInput(paymentAmount));
    if (amount <= 0) {
      setErrorMessage('Please enter a valid payment amount.');
      return;
    }

    if (roundMoney(amount) > roundMoney(currentBalance)) {
      setErrorMessage(`Payment cannot be more than the balance of ${formatCedi(currentBalance)}.`);
      return;
    }

    setConfirmAmount(amount);
    setPendingConfirmType('payment');
    setShowConfirmModal(true);
  };

  // 2. Initiate Add Credit Purchase (Triggers confirmation dialog)
  const handleInitiateCreditPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amount = roundMoney(parseCediInput(creditAmount));
    if (amount <= 0) {
      setErrorMessage('Please enter the price of parts taken on credit.');
      return;
    }

    setConfirmAmount(amount);
    setPendingConfirmType('credit');
    setShowConfirmModal(true);
  };

  // 3. Confirmed Save from Dialog
  const handleConfirmedSave = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (pendingConfirmType === 'payment') {
        const res = await paymentService.recordPayment({
          customerId: customer.id,
          amount: confirmAmount,
          notes: paymentNotes.trim() || undefined,
        });

        setCurrentBalance(res.newBalance);
        showSuccess(`Cash payment of ${formatCedi(confirmAmount)} recorded. New balance: ${formatCedi(res.newBalance)}`);
        setPaymentAmount('');
        setPaymentNotes('');
        setActiveForm('none');
        await loadHistory();
        onUpdate();
      } else {
        const res = await paymentService.addCreditPurchase({
          customerId: customer.id,
          amount: confirmAmount,
          description: creditDescription.trim() || 'Spare parts taken on credit',
        });

        setCurrentBalance(res.newBalance);
        showSuccess(`Credit entry of ${formatCedi(confirmAmount)} recorded. Balance: ${formatCedi(res.newBalance)}`);
        setCreditAmount('');
        setCreditDescription('');
        setActiveForm('none');
        await loadHistory();
        onUpdate();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not save record. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <div 
          className="w-full max-w-xl bg-surface rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[92vh] border border-border animate-in fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="bg-surface-muted p-4 sm:p-5 border-b border-border flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-secondary">Customer Credit Account</span>
              <h2 className="text-xl sm:text-2xl font-black text-primary mt-0.5">
                {customer.name}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-secondary">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{customer.phone || 'No phone recorded'}</span>
                </span>
                {customer.notes && (
                  <span>· {customer.notes}</span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-secondary hover:text-primary transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success / Error Alerts */}
          {successMessage && (
            <div className="m-4 mb-0 p-3 rounded-lg bg-positive-soft border border-positive text-positive flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-positive" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="m-4 mb-0 p-3 rounded-lg bg-danger/10 border border-danger text-danger flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            
            {/* Account Financial Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-surface-muted border border-border">
                <span className="text-[11px] font-semibold text-secondary block">Total Credit</span>
                <span className="text-sm sm:text-base font-black text-primary mt-0.5 block">
                  {formatCedi(totalCredit)}
                </span>
                <span className="text-[10px] text-secondary">All purchases</span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-muted border border-border">
                <span className="text-[11px] font-semibold text-secondary block">Total Paid</span>
                <span className="text-sm sm:text-base font-black text-positive mt-0.5 block">
                  {formatCedi(totalPaid)}
                </span>
                <span className="text-[10px] text-secondary">Cash payments</span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface border border-border">
                <span className="text-[11px] font-semibold text-secondary block">Current Balance</span>
                <span className={`text-base sm:text-lg font-black mt-0.5 block ${
                  currentBalance > 0 ? 'text-danger' : 'text-positive'
                }`}>
                  {formatCedi(currentBalance)}
                </span>
                <span className="text-[10px] text-secondary">
                  {currentBalance > 0 ? 'Amount owed' : 'Cleared'}
                </span>
              </div>
            </div>

            {/* Action Buttons: Large RECORD PAYMENT Button */}
            {activeForm === 'none' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentAmount(currentBalance > 0 ? currentBalance.toFixed(2) : '');
                    setActiveForm('payment');
                    setErrorMessage(null);
                  }}
                  className="w-full py-4 px-4 rounded-lg bg-positive hover:opacity-90 text-surface font-black text-base flex items-center justify-center gap-2 transition"
                >
                  <Banknote className="w-5 h-5 text-surface" />
                  <span>+ RECORD PAYMENT</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveForm('add_credit');
                    setErrorMessage(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-surface-muted hover:bg-surface text-secondary border border-border font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Credit Entry Manually</span>
                </button>
              </div>
            )}

            {/* Form 1: RECORD PAYMENT FORM (Cash only, no MoMo, no selector) */}
            {activeForm === 'payment' && (
              <form onSubmit={handleInitiatePayment} className="p-4 rounded-lg bg-surface-muted border border-border space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-positive" />
                    <span>Record Cash Payment</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveForm('none')}
                    className="text-xs text-secondary hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Amount Paid (GH₵) <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-secondary text-sm">
                      GH₵
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => handleMoneyInputChange(e.target.value, setPaymentAmount)}
                      className="w-full pl-12 pr-4 py-2.5 bg-surface border border-border rounded-lg text-primary font-bold text-base outline-hidden focus:border-accent"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(currentBalance.toFixed(2))}
                      className="text-[11px] font-bold text-accent hover:underline"
                    >
                      Pay Full Balance ({formatCedi(currentBalance)})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Note / Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid cash at the shop counter"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-primary text-xs outline-hidden focus:border-accent"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveForm('none')}
                    className="flex-1 py-2.5 rounded-lg border border-border bg-surface text-secondary font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-positive hover:opacity-90 text-surface font-bold text-xs transition"
                  >
                    Save Cash Payment
                  </button>
                </div>
              </form>
            )}

            {/* Form 2: ADD CREDIT ENTRY MANUALLY */}
            {activeForm === 'add_credit' && (
              <form onSubmit={handleInitiateCreditPurchase} className="p-4 rounded-lg bg-surface-muted border border-border space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-warning" />
                    <span>Add Credit Entry</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveForm('none')}
                    className="text-xs text-secondary hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Credit Amount (GH₵) <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-secondary text-sm">
                      GH₵
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={creditAmount}
                      onChange={(e) => handleMoneyInputChange(e.target.value, setCreditAmount)}
                      className="w-full pl-12 pr-4 py-2.5 bg-surface border border-border rounded-lg text-primary font-bold text-base outline-hidden focus:border-accent"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Parts Description / Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sprinter brake pad set & shock absorber"
                    value={creditDescription}
                    onChange={(e) => setCreditDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-primary text-xs outline-hidden focus:border-accent"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveForm('none')}
                    className="flex-1 py-2.5 rounded-lg border border-border bg-surface text-secondary font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-xs transition"
                  >
                    Save Credit Entry
                  </button>
                </div>
              </form>
            )}

            {/* Plain Transaction History (Date, Description, Credit or Payment, Amount) - Immutable, no edit/delete */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-accent" />
                  <span>Transaction History</span>
                </h3>
                <span className="text-xs text-secondary">
                  {transactions.length} {transactions.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-14 bg-surface-muted rounded-lg border border-border animate-pulse" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-6 text-center rounded-lg bg-surface-muted border border-border text-secondary text-xs space-y-1">
                  <FileText className="w-6 h-6 mx-auto opacity-40 mb-1" />
                  <p className="font-semibold text-primary">No transactions recorded</p>
                  <p>Credit sales and payments for this customer will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const isPayment = tx.type === 'PAYMENT';
                    return (
                      <div
                        key={tx.id}
                        className="p-3 rounded-lg border border-border bg-surface flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-lg font-bold text-[10px] border ${
                                isPayment
                                  ? 'bg-positive-soft text-positive border-positive'
                                  : 'bg-surface-muted text-warning border-warning'
                              }`}
                            >
                              {isPayment ? 'PAYMENT' : 'CREDIT'}
                            </span>
                            <span className="text-secondary text-[11px]">
                              {formatReceiptDate(tx.created_at)}
                            </span>
                          </div>

                          <p className="font-medium text-primary mt-1 truncate">
                            {tx.notes || tx.reference || (isPayment ? 'Cash Payment' : 'Credit Purchase')}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-black text-sm block ${
                              isPayment ? 'text-positive' : 'text-danger'
                            }`}
                          >
                            {isPayment ? `-${formatCedi(tx.amount)}` : `+${formatCedi(tx.amount)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 bg-surface-muted border-t border-border flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-surface hover:bg-surface-muted border border-border text-secondary font-bold text-xs"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      {/* Confirmation Dialog before saving payment or credit entry */}
      <ConfirmAmountModal
        isOpen={showConfirmModal}
        amount={confirmAmount}
        title="Is this amount correct?"
        description={
          pendingConfirmType === 'payment'
            ? `Cash payment from ${customer.name}`
            : `Credit entry for ${customer.name}`
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
