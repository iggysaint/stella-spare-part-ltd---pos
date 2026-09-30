import { Product, ProductCategory } from '../types';
import { supabase } from './supabaseClient';
import { fuzzyMatch } from '../utils/fuzzySearch';
import { roundMoney } from '../utils/currency';

export interface ProductFilter {
  category?: ProductCategory | 'All Parts';
  searchQuery?: string;
  lowStockOnly?: boolean;
}

class ProductService {
  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (filter?.category && filter.category !== 'All Parts') {
      query = query.eq('category', filter.category);
    }

    if (filter?.lowStockOnly) {
      // Filter applied client-side after fetch since it's a comparison
    }

    const { data, error } = await query;
    if (error) throw error;

    let list = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      selling_price: Number(p.selling_price),
      cost_price: Number(p.cost_price),
      stock_quantity: Number(p.stock_quantity),
      low_stock_threshold: Number(p.low_stock_threshold),
      sku: p.sku,
      compatible_vehicles: p.compatible_vehicles || [],
      description: p.description,
      image_url: p.image_url,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

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

    return list;
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      selling_price: Number(data.selling_price),
      cost_price: Number(data.cost_price),
      stock_quantity: Number(data.stock_quantity),
      low_stock_threshold: Number(data.low_stock_threshold),
      sku: data.sku,
      compatible_vehicles: data.compatible_vehicles || [],
      description: data.description,
      image_url: data.image_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async addProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data: result, error } = await supabase
      .from('products')
      .insert({
        name: data.name,
        category: data.category,
        selling_price: roundMoney(data.selling_price),
        cost_price: roundMoney(data.cost_price),
        stock_quantity: data.stock_quantity,
        low_stock_threshold: data.low_stock_threshold,
        sku: data.sku,
        compatible_vehicles: data.compatible_vehicles,
        description: data.description,
        image_url: data.image_url,
      })
      .select()
      .single();

    if (error) throw error;
    if (!result) throw new Error('Failed to create product');

    return {
      id: result.id,
      name: result.name,
      category: result.category,
      selling_price: Number(result.selling_price),
      cost_price: Number(result.cost_price),
      stock_quantity: Number(result.stock_quantity),
      low_stock_threshold: Number(result.low_stock_threshold),
      sku: result.sku,
      compatible_vehicles: result.compatible_vehicles || [],
      description: result.description,
      image_url: result.image_url,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.selling_price !== undefined) updateData.selling_price = roundMoney(data.selling_price);
    if (data.cost_price !== undefined) updateData.cost_price = roundMoney(data.cost_price);
    if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity;
    if (data.low_stock_threshold !== undefined) updateData.low_stock_threshold = data.low_stock_threshold;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.compatible_vehicles !== undefined) updateData.compatible_vehicles = data.compatible_vehicles;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;

    const { data: result, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!result) throw new Error('Product not found');

    return {
      id: result.id,
      name: result.name,
      category: result.category,
      selling_price: Number(result.selling_price),
      cost_price: Number(result.cost_price),
      stock_quantity: Number(result.stock_quantity),
      low_stock_threshold: Number(result.low_stock_threshold),
      sku: result.sku,
      compatible_vehicles: result.compatible_vehicles || [],
      description: result.description,
      image_url: result.image_url,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }

  async quickAdjustStock(id: string, delta: number): Promise<number> {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error('Product not found');
    if (!product) throw new Error('Product not found');

    const newQty = Math.max(0, Number(product.stock_quantity) + delta);

    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: newQty })
      .eq('id', id);

    if (updateError) throw updateError;

    return newQty;
  }

  async quickUpdatePrice(id: string, newPrice: number): Promise<number> {
    const price = Math.max(0, roundMoney(newPrice));

    const { error } = await supabase
      .from('products')
      .update({ selling_price: price })
      .eq('id', id);

    if (error) throw new Error('Product not found');

    return price;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  async getLowStockProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return (data || [])
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        selling_price: Number(p.selling_price),
        cost_price: Number(p.cost_price),
        stock_quantity: Number(p.stock_quantity),
        low_stock_threshold: Number(p.low_stock_threshold),
        sku: p.sku,
        compatible_vehicles: p.compatible_vehicles || [],
        description: p.description,
        image_url: p.image_url,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }))
      .filter((p) => p.stock_quantity <= p.low_stock_threshold);
  }

  async deductStock(items: { productId: string; quantity: number }[]): Promise<void> {
    // This is only used by the old salesService implementation.
    // The new Supabase RPC create_sale handles stock deduction atomically.
    // Kept for backward compatibility but won't be used with the new flow.
    for (const item of items) {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.productId)
        .single();

      if (fetchError || !product) continue;

      const newQty = Math.max(0, Number(product.stock_quantity) - item.quantity);

      await supabase
        .from('products')
        .update({ stock_quantity: newQty })
        .eq('id', item.productId);
    }
  }
}

export const productService = new ProductService();
