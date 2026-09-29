import React, { useState } from 'react';
import { Sale } from '../../types';
import { formatCedi } from '../../utils/currency';
import { receiptService } from '../../services/receiptService';
import { ThermalReceipt } from '../common/ThermalReceipt';
import { CheckCircle2, Printer, PlusCircle, FileText, ArrowRight } from 'lucide-react';

interface SaleSuccessModalProps {
  sale: Sale;
  onNewSale: () => void;
  onViewSale: (saleId: string) => void;
  onClose: () => void;
}

export const SaleSuccessModal: React.FC<SaleSuccessModalProps> = ({
  sale,
  onNewSale,
  onViewSale,
}) => {
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const formattedReceipt = receiptService.formatReceipt(sale);

  const handlePrint = async () => {
    setIsPrinting(true);
    await receiptService.printReceipt(sale);
    setTimeout(() => setIsPrinting(false), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-surface rounded-lg shadow-xl overflow-hidden border border-border animate-in fade-in duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Banner (Flat Positive) */}
        <div className="bg-positive text-surface p-6 text-center">
          <div className="w-14 h-14 bg-surface/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-surface" />
          </div>
          <span className="text-xs font-semibold text-surface/80 block">
            Transaction Successful
          </span>
          <h2 className="text-2xl font-black mt-0.5">Sale Completed</h2>
          <p className="text-surface/90 text-sm font-mono mt-1 font-bold">
            Receipt #{sale.receipt_number}
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="p-4 rounded-lg bg-surface-muted border border-border space-y-2.5">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-secondary">Amount Paid</span>
              <span className="text-2xl font-black text-primary">{formatCedi(sale.total_amount)}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary">Payment Method:</span>
              <span className="px-2.5 py-1 rounded-lg font-bold bg-surface border border-border text-primary uppercase">
                {sale.payment_method}
              </span>
            </div>

            {sale.customer_name && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary">Customer:</span>
                <span className="font-bold text-primary">{sale.customer_name}</span>
              </div>
            )}

            {sale.payment_method === 'CASH' && (
              <div className="flex justify-between items-center text-xs pt-1 border-t border-border">
                <span className="text-secondary">Change Given:</span>
                <span className="font-bold text-positive">{formatCedi(sale.change_given)}</span>
              </div>
            )}

            {sale.payment_method === 'CREDIT' && (
              <div className="flex justify-between items-center text-xs pt-1 border-t border-border">
                <span className="text-secondary">Outstanding Balance:</span>
                <span className="font-bold text-danger">{formatCedi(sale.outstanding_credit)}</span>
              </div>
            )}
          </div>

          {/* Toggle Receipt Preview */}
          <div>
            <button
              type="button"
              onClick={() => setShowReceiptPreview(!showReceiptPreview)}
              className="w-full py-2.5 px-3 rounded-lg border border-border bg-surface hover:bg-surface-muted text-xs font-bold text-secondary flex items-center justify-center gap-1.5 transition"
            >
              <FileText className="w-4 h-4 text-secondary" />
              <span>{showReceiptPreview ? 'Hide Receipt View' : 'Preview Paper Receipt'}</span>
            </button>

            {showReceiptPreview && (
              <div className="mt-3 p-3 bg-surface-muted rounded-lg flex justify-center border border-border overflow-x-auto">
                <div className="rounded-lg bg-surface border border-border">
                  <ThermalReceipt receipt={formattedReceipt} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="p-4 sm:p-5 bg-surface-muted border-t border-border space-y-2.5">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full py-3 px-4 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-sm flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4 text-surface" />
            <span>{isPrinting ? 'Opening Print Dialog...' : 'PRINT RECEIPT'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onNewSale}
              className="py-2.5 px-3 rounded-lg bg-surface hover:bg-surface-muted border border-border text-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
            >
              <PlusCircle className="w-4 h-4 text-accent" />
              <span>NEW SALE</span>
            </button>

            <button
              type="button"
              onClick={() => onViewSale(sale.id)}
              className="py-2.5 px-3 rounded-lg bg-surface hover:bg-surface-muted border border-border text-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
            >
              <span>VIEW SALE</span>
              <ArrowRight className="w-4 h-4 text-secondary" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
