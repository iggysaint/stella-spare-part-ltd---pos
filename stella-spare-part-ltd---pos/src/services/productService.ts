import { Product, ProductCategory } from '../types';
import { storage } from './storage';
import { fuzzyMatch } from '../utils/fuzzySearch';
import { roundMoney } from '../utils/currency';

export interface ProductFilter {
  category?: ProductCategory | 'All Parts';
  searchQuery?: string;
  lowStockOnly?: boolean;
}

class ProductService {
  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    let list = storage.getProducts();

    if (filter?.category && filter.category !== 'All Parts') {
      list = list.filter((p) => p.category === filter.category);
    }

    if (filter?.lowStockOnly) {
      list = list.filter((p) => p.stock_quantity <= p.low_stock_threshold);
    }

    if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.trim();
      list = list.filter((p) => {
        const searchableText = `${p.name} ${p.category} ${p.compatible_vehicles?.join(' ') || ''} ${p.sku || ''} ${p.description || ''}`;
        return fuzzyMatch(q, searchableText);
      });
    }

    // Sort by name
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProductById(id: string): Promise<Product | null> {
    const list = storage.getProducts();
    return list.find((p) => p.id === id) || null;
  }

  async addProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const list = storage.getProducts();
    const newProduct: Product = {
      ...data,
      selling_price: roundMoney(data.selling_price),
      cost_price: roundMoney(data.cost_price),
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newProduct);
    storage.saveProducts(list);
    return newProduct;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const list = storage.getProducts();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }

    const updatedData = { ...data };
    if (updatedData.selling_price !== undefined) {
      updatedData.selling_price = roundMoney(updatedData.selling_price);
    }
    if (updatedData.cost_price !== undefined) {
      updatedData.cost_price = roundMoney(updatedData.cost_price);
    }

    const updated: Product = {
      ...list[index],
      ...updatedData,
      updated_at: new Date().toISOString(),
    };

    list[index] = updated;
    storage.saveProducts(list);
    return updated;
  }

  async quickAdjustStock(id: string, delta: number): Promise<number> {
    const list = storage.getProducts();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const newQty = Math.max(0, list[index].stock_quantity + delta);
    list[index].stock_quantity = newQty;
    list[index].updated_at = new Date().toISOString();
    storage.saveProducts(list);
    return newQty;
  }

  async quickUpdatePrice(id: string, newPrice: number): Promise<number> {
    const list = storage.getProducts();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');

    list[index].selling_price = Math.max(0, roundMoney(newPrice));
    list[index].updated_at = new Date().toISOString();
    storage.saveProducts(list);
    return list[index].selling_price;
  }

  async deleteProduct(id: string): Promise<void> {
    const list = storage.getProducts();
    const filtered = list.filter((p) => p.id !== id);
    storage.saveProducts(filtered);
  }

  async getLowStockProducts(): Promise<Product[]> {
    const list = storage.getProducts();
    return list.filter((p) => p.stock_quantity <= p.low_stock_threshold);
  }

  async deductStock(items: { productId: string; quantity: number }[]): Promise<void> {
    const list = storage.getProducts();
    for (const item of items) {
      const prod = list.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock_quantity = Math.max(0, prod.stock_quantity - item.quantity);
        prod.updated_at = new Date().toISOString();
      }
    }
    storage.saveProducts(list);
  }
}

export const productService = new ProductService();
