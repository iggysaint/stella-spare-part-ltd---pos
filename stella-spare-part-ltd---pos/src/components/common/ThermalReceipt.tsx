import React from 'react';
import { FormattedReceiptData } from '../../services/receiptService';

interface ThermalReceiptProps {
  receipt: FormattedReceiptData;
  className?: string;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ receipt, className = '' }) => {
  const is58mm = receipt.paperSize === '58mm';

  return (
    <div
      className={`printable-receipt font-mono text-primary bg-surface p-4 leading-tight select-text ${
        is58mm ? 'size-58mm max-w-[54mm] text-[11px]' : 'max-w-[76mm] text-xs'
      } ${className}`}
    >
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-border">
        <h2 className="font-bold text-sm uppercase text-primary">{receipt.shopName}</h2>
        <p className="text-[11px] text-secondary">{receipt.address}</p>
        <p className="text-[11px] text-secondary font-semibold">{receipt.phoneNumber}</p>
        <div className="mt-1 flex justify-between text-[11px] text-primary">
          <span>Receipt: <strong className="font-mono text-primary">{receipt.receiptNumber}</strong></span>
        </div>
        <div className="text-left text-[11px] text-secondary">
          <span>{receipt.dateFormatted}</span>
        </div>
        {receipt.customerName && (
          <div className="text-left text-[11px] mt-0.5 font-medium text-primary">
            <span>Customer: {receipt.customerName}</span>
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="py-2 space-y-1.5 border-b border-dashed border-border">
        {receipt.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start gap-1">
            <div className="flex-1 min-w-0 pr-1">
              <p className="font-semibold text-primary truncate">{item.name}</p>
              <p className="text-[10px] text-secondary">{item.qtyAndPrice}</p>
            </div>
            <div className="font-bold text-primary text-right whitespace-nowrap">
              {item.total}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="py-2 space-y-1 border-b border-dashed border-border text-xs">
        {receipt.discount && (
          <div className="flex justify-between text-secondary">
            <span>Subtotal</span>
            <span>{receipt.subtotal}</span>
          </div>
        )}
        {receipt.discount && (
          <div className="flex justify-between text-secondary">
            <span>Discount</span>
            <span>-{receipt.discount}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm text-primary pt-0.5">
          <span>TOTAL</span>
          <span className="text-base">{receipt.total}</span>
        </div>

        {/* Payment info */}
        <div className="pt-1.5 border-t border-dotted border-border space-y-0.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-secondary">Payment:</span>
            <span className="font-bold text-primary">{receipt.paymentMethod}</span>
          </div>

          {receipt.paymentMethod === 'CASH' && (
            <>
              {receipt.received && (
                <div className="flex justify-between">
                  <span className="text-secondary">Received:</span>
                  <span>{receipt.received}</span>
                </div>
              )}
              {receipt.change && (
                <div className="flex justify-between font-bold text-primary">
                  <span>Change:</span>
                  <span>{receipt.change}</span>
                </div>
              )}
            </>
          )}

          {receipt.paymentMethod === 'CREDIT' && (
            <>
              {receipt.amountPaidNow && (
                <div className="flex justify-between">
                  <span className="text-secondary">Amount Paid Now:</span>
                  <span className="font-medium">{receipt.amountPaidNow}</span>
                </div>
              )}
              {receipt.outstandingBalance && (
                <div className="flex justify-between font-bold text-primary">
                  <span>Balance Due:</span>
                  <span>{receipt.outstandingBalance}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-2 text-[10px] text-secondary space-y-0.5">
        <p className="font-medium text-primary">{receipt.footerText}</p>
        <p className="text-[9px] text-secondary">Printed via Stella POS</p>
      </div>
    </div>
  );
};
