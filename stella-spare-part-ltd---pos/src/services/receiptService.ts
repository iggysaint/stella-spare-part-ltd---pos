import { Sale, ShopSettings } from '../types';
import { storage } from './storage';
import { formatReceiptDate } from '../utils/date';
import { formatCedi, roundMoney } from '../utils/currency';

export interface FormattedReceiptData {
  shopName: string;
  phoneNumber: string;
  address: string;
  receiptNumber: string;
  dateFormatted: string;
  customerName?: string;
  items: {
    name: string;
    qtyAndPrice: string;
    total: string;
  }[];
  subtotal: string;
  discount?: string;
  total: string;
  paymentMethod: string;
  // Cash details
  received?: string;
  change?: string;
  // Credit details
  amountPaidNow?: string;
  outstandingBalance?: string;
  footerText: string;
  paperSize: '58mm' | '80mm';
}

class ReceiptService {
  formatReceipt(sale: Sale, settings?: ShopSettings): FormattedReceiptData {
    const shop = settings || storage.getSettings();

    const items = (sale.items || []).map((item) => ({
      name: item.product_name,
      qtyAndPrice: `${item.quantity} x ${formatCedi(item.unit_price)}`,
      total: formatCedi(item.total_price),
    }));

    const gross = (sale.items || []).reduce((acc, i) => roundMoney(acc + i.total_price), 0);

    const formatted: FormattedReceiptData = {
      shopName: shop.shop_name,
      phoneNumber: shop.phone_number,
      address: shop.address,
      receiptNumber: sale.receipt_number,
      dateFormatted: formatReceiptDate(sale.created_at),
      customerName: sale.customer_name || undefined,
      items,
      subtotal: formatCedi(gross),
      discount: sale.discount_amount > 0 ? formatCedi(sale.discount_amount) : undefined,
      total: formatCedi(sale.total_amount),
      paymentMethod: sale.payment_method,
      footerText: shop.receipt_footer,
      paperSize: shop.receipt_paper_size,
    };

    if (sale.payment_method === 'CASH') {
      formatted.received = formatCedi(sale.amount_received);
      formatted.change = formatCedi(sale.change_given);
    } else if (sale.payment_method === 'CREDIT') {
      formatted.amountPaidNow = formatCedi(sale.amount_paid_now);
      formatted.outstandingBalance = formatCedi(sale.outstanding_credit);
    }

    return formatted;
  }

  async printReceipt(sale: Sale): Promise<boolean> {
    try {
      window.dispatchEvent(
        new CustomEvent('stella:print-receipt', {
          detail: { sale },
        })
      );

      // Brief delay to allow print container rendering
      setTimeout(() => {
        window.print();
      }, 100);
      return true;
    } catch (err) {
      console.error('Print failed:', err);
      return false;
    }
  }
}

export const receiptService = new ReceiptService();
