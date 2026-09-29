/**
 * Ghanaian Cedi Currency Formatter
 * Formats numbers into GH₵ 0.00 standard
 */
export function formatCedi(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'GH₵0.00';
  }
  
  const formatted = new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `GH₵${formatted}`;
}

export function parseCediInput(value: string): number {
  if (!value) return 0;
  // Strip any non-digit/dot characters
  const clean = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Round monetary amounts to 2 decimal places using epsilon to eliminate floating-point drift
 */
export function roundMoney(n: number | null | undefined): number {
  if (n === null || n === undefined || isNaN(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculateChange(amountReceived: number, totalAmount: number): number {
  const change = roundMoney(amountReceived) - roundMoney(totalAmount);
  return change > 0 ? roundMoney(change) : 0;
}
