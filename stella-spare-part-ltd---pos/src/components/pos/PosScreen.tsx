import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductCategory, CartItem, Sale, PaymentMethod } from '../../types';
import { productService } from '../../services/productService';
import { salesService } from '../../services/salesService';
import { formatCedi, roundMoney } from '../../utils/currency';
import { CategoryIcon } from '../common/CategoryIcon';
import { CheckoutModal } from './CheckoutModal';
import { SaleSuccessModal } from './SaleSuccessModal';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  AlertTriangle,
  CarFront,
  Check,
  ArrowRight,
  PackagePlus
} from 'lucide-react';

const CATEGORIES: (ProductCategory | 'All Parts')[] = [
  'All Parts',
  'Brakes',
  'Engine',
  'Suspension',
  'Cooling',
  'Electrical',
  'Transmission',
  'Fuel',
  'Body/Van',
];

interface PosScreenProps {
  onViewSaleHistory: (saleId?: string) => void;
  onNavigate?: (tab: string) => void;
}

export const PosScreen: React.FC<PosScreenProps> = ({ onViewSaleHistory, onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All Parts'>('All Parts');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Mobile cart drawer state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Checkout & Success Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Load products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const prods = await productService.getProducts({
        category: selectedCategory,
        searchQuery: searchQuery,
      });
      setProducts(prods);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  // Cart calculations with roundMoney
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => roundMoney(sum + roundMoney(item.total_price)), 0);
  }, [cart]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: roundMoney((item.quantity + 1) * item.unit_price),
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unit_price: roundMoney(product.selling_price),
            total_price: roundMoney(product.selling_price),
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock_quantity) return item;
            return {
              ...item,
              quantity: newQty,
              total_price: roundMoney(newQty * item.unit_price),
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCompleteCheckout = async (data: {
    paymentMethod: PaymentMethod;
    amountReceived?: number;
    customerId?: string;
    amountPaidNow?: number;
    notes?: string;
  }) => {
    const sale = await salesService.createSale({
      items: cart,
      paymentMethod: data.paymentMethod,
      discountAmount: 0,
      amountReceived: data.amountReceived,
      customerId: data.customerId,
      amountPaidNow: data.amountPaidNow,
      notes: data.notes,
    });

    clearCart();
    setIsCheckoutOpen(false);
    setIsMobileCartOpen(false);
    setCompletedSale(sale);
    fetchProducts();
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-5">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        
        {/* LEFT COLUMN: Clean Products Catalog (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* 1. Search Bar */}
          <div className="bg-surface p-3 rounded-lg border border-border">
            <div className="relative">
              <Search className="w-5 h-5 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search part (e.g. Brake pad, Sprinter filter)..."
                className="w-full pl-11 pr-10 py-3 rounded-lg border border-border bg-surface text-base font-bold text-primary outline-none focus:border-accent placeholder:text-secondary placeholder:font-normal"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-secondary hover:text-primary rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Fast Horizontal Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-2 px-3.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-accent text-surface border-accent'
                      : 'bg-surface text-secondary border-border hover:bg-surface-muted hover:text-primary'
                  }`}
                >
                  <CategoryIcon category={cat} className="w-4 h-4" />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* 3. Product Cards Grid */}
          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-36 bg-surface-muted rounded-lg border border-border animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-surface rounded-lg p-8 text-center border border-border space-y-3">
                <Search className="w-10 h-10 mx-auto text-secondary opacity-60" />
                <div>
                  <h4 className="font-bold text-primary text-base">No spare parts in inventory</h4>
                  <p className="text-xs text-secondary mt-1">
                    No parts yet. Tap + Add Product to register parts and start selling.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('products')}
                      className="px-4 py-2 bg-accent hover:bg-accent-hover text-surface rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <PackagePlus className="w-4 h-4" />
                      <span>+ Add Product</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All Parts');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 bg-surface-muted hover:bg-surface text-secondary border border-border rounded-lg text-xs font-bold transition"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((prod) => {
                  const inCartItem = cart.find((i) => i.product.id === prod.id);
                  const isOutOfStock = prod.stock_quantity <= 0;
                  const isLowStock = prod.stock_quantity <= prod.low_stock_threshold && !isOutOfStock;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => !isOutOfStock && addToCart(prod)}
                      className={`relative bg-surface rounded-lg p-4 border transition-colors flex flex-col justify-between select-none ${
                        isOutOfStock
                          ? 'opacity-50 border-border bg-surface-muted cursor-not-allowed'
                          : inCartItem
                          ? 'border-accent ring-1 ring-accent cursor-pointer'
                          : 'border-border hover:border-accent cursor-pointer'
                      }`}
                    >
                      {/* Top In-Cart Badge */}
                      {inCartItem && (
                        <div className="absolute -top-2.5 -right-2 bg-accent text-surface font-bold px-2 py-0.5 rounded-lg text-xs border border-surface flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{inCartItem.quantity} in cart</span>
                        </div>
                      )}

                      {/* Part Information */}
                      <div>
                        {/* Stock status */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-semibold text-secondary">
                            {prod.category}
                          </span>
                          {isOutOfStock ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-danger-soft text-danger border border-danger">
                              Out of stock
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-surface-muted text-warning border border-border flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-warning" />
                              {prod.stock_quantity} left
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-surface-muted text-secondary border border-border">
                              {prod.stock_quantity} in stock
                            </span>
                          )}
                        </div>

                        {/* Part Name */}
                        <h4 className="font-bold text-base text-primary leading-snug">
                          {prod.name}
                        </h4>

                        {/* Vehicle */}
                        {prod.compatible_vehicles && prod.compatible_vehicles.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-secondary font-medium">
                            <CarFront className="w-3.5 h-3.5 text-secondary shrink-0" />
                            <span className="truncate">{prod.compatible_vehicles.join(' / ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Price & Quick Add Button */}
                      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                        <span className="font-black text-xl text-primary">
                          {formatCedi(prod.selling_price)}
                        </span>

                        {inCartItem ? (
                          <div 
                            className="flex items-center gap-1 bg-accent-soft rounded-lg p-0.5 border border-border"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => updateQuantity(prod.id, -1)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface text-primary font-bold hover:bg-surface-muted transition"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-xs text-primary">
                              {inCartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(prod.id, 1)}
                              disabled={inCartItem.quantity >= prod.stock_quantity}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-accent text-surface font-bold disabled:opacity-40 transition"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-xs flex items-center gap-1 transition disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                            <span>ADD</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Clean Cart & Checkout Summary (Desktop) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-22">
          <div className="bg-surface rounded-lg p-5 border border-border space-y-4">
            
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent-soft text-accent border border-border">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-primary">Current Cart</h3>
                  <span className="text-xs text-secondary font-medium">
                    {totalCartCount} {totalCartCount === 1 ? 'part' : 'parts'}
                  </span>
                </div>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-semibold text-danger hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 px-4 text-secondary">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30 text-secondary" />
                  <p className="font-bold text-sm text-primary">Cart is empty</p>
                  <p className="text-xs text-secondary mt-0.5">
                    Tap any spare part from the left to start selling.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-lg bg-surface-muted border border-border flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-primary truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-secondary mt-0.5 font-medium">
                        {formatCedi(item.unit_price)} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 shrink-0 bg-surface rounded-lg border border-border p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-muted text-primary"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-danger" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-primary">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock_quantity}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-muted text-primary disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="w-18 text-right font-black text-xs text-primary shrink-0">
                      {formatCedi(item.total_price)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Giant Checkout Button */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-secondary">Total Price</span>
                  <span className="text-3xl font-black text-primary">
                    {formatCedi(cartSubtotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-4 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-lg transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5 text-surface" />
                  <span>CHARGE {formatCedi(cartSubtotal)}</span>
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Floating Bottom Cart Bar on Mobile when items exist */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-18 left-3 right-3 z-30">
          <div className="bg-surface text-primary rounded-lg p-3.5 shadow-xl flex items-center justify-between border border-border">
            <div 
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center gap-2.5 cursor-pointer flex-1"
            >
              <div className="relative p-2 rounded-lg bg-accent text-surface">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger text-surface rounded-lg text-[10px] font-bold flex items-center justify-center border border-surface">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-xs text-secondary font-medium">{totalCartCount} items in cart</p>
                <p className="text-lg font-black text-primary">{formatCedi(cartSubtotal)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="py-2.5 px-4 rounded-lg bg-accent text-surface font-bold text-sm flex items-center gap-1 transition"
            >
              <span>CHARGE</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Drawer (Elevated Surface) */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full bg-surface rounded-t-lg p-5 shadow-xl border-t border-border max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-base text-primary">
                  Cart ({totalCartCount} parts)
                </h3>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="overflow-y-auto flex-1 py-3 space-y-2.5">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 rounded-lg bg-surface-muted border border-border flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-sm text-primary truncate">{item.product.name}</p>
                    <p className="text-xs text-secondary">{formatCedi(item.unit_price)} each</p>
                  </div>
                  <div className="flex items-center gap-1 bg-surface rounded-lg border border-border p-0.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-muted text-primary"
                    >
                      {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-danger" /> : <Minus className="w-4 h-4" />}
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-primary">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.stock_quantity}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-muted text-primary disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-20 text-right font-black text-sm text-primary pl-2">
                    {formatCedi(item.total_price)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total and Checkout */}
            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-secondary">Total</span>
                <span className="text-2xl font-black text-primary">{formatCedi(cartSubtotal)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 bg-accent hover:bg-accent-hover text-surface font-bold text-base rounded-lg transition"
              >
                PROCEED TO PAYMENT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          totalAmount={cartSubtotal}
          discountAmount={0}
          onClose={() => setIsCheckoutOpen(false)}
          onComplete={handleCompleteCheckout}
        />
      )}

      {/* Sale Success Modal */}
      {completedSale && (
        <SaleSuccessModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
          onNewSale={() => {
            setCompletedSale(null);
          }}
          onViewSale={(id: string) => {
            setCompletedSale(null);
            onViewSaleHistory(id);
          }}
        />
      )}

    </div>
  );
};
