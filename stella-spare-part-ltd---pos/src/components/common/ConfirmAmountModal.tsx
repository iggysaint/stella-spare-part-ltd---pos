import React from 'react';
import { formatCedi } from '../../utils/currency';
import { HelpCircle } from 'lucide-react';

interface ConfirmAmountModalProps {
  isOpen: boolean;
  amount: number;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmAmountModal: React.FC<ConfirmAmountModalProps> = ({
  isOpen,
  amount,
  title = 'Is this amount correct?',
  description,
  confirmLabel = 'Yes, save',
  cancelLabel = 'No, go back',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-xl text-primary border border-border text-center space-y-5">
        <div className="mx-auto w-12 h-12 rounded-lg bg-accent-soft text-accent border border-border flex items-center justify-center">
          <HelpCircle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          {description && (
            <p className="text-xs text-secondary mt-1">{description}</p>
          )}
        </div>

        <div className="py-3 px-4 bg-surface-muted rounded-lg border border-border">
          <span className="text-3xl font-black text-accent tracking-tight">
            {formatCedi(amount)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="w-full py-3.5 px-4 rounded-lg border border-border font-bold text-sm text-secondary hover:bg-surface-muted transition"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="w-full py-3.5 px-4 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-sm transition"
          >
            {isLoading ? 'Saving...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
