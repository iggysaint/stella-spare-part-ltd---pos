import React, { useState, useEffect } from 'react';
import { Product, ProductCategory } from '../../types';
import { productService } from '../../services/productService';
import { formatCedi, parseCediInput, roundMoney } from '../../utils/currency';
import { CategoryIcon } from '../common/CategoryIcon';
import { 
  Plus, 
  Minus, 
  Search, 
  Trash2, 
  AlertTriangle, 
  X, 
  Boxes,
  CarFront,
  Edit2,
  Check
} from 'lucide-react';

const CATEGORIES: (ProductCategory | 'All')[] = [
  'All',
  'Brakes',
  'Engine',
  'Suspension',
  'Cooling',
  'Electrical',
  'Transmission',
  'Fuel',
  'Body/Van',
];

interface ProductsScreenProps {
  initialOpenAddModal?: boolean;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({ initialOpenAddModal = false }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add/Edit Part Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Brakes');
  const [vehicle, setVehicle] = useState('Mercedes-Benz Sprinter / Toyota HiAce');
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Price Edit inline popover
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceValue, setNewPriceValue] = useState('');

  // Delete confirm
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const list = await productService.getProducts({
        category: selectedCategory === 'All' ? 'All Parts' : (selectedCategory as ProductCategory),
        searchQuery,
        lowStockOnly,
      });
      setProducts(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchQuery, selectedCategory, lowStockOnly]);

  useEffect(() => {
    if (initialOpenAddModal) {
      handleOpenAdd();
    }
  }, [initialOpenAddModal]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setStock('10');
    setCategory('Brakes');
    setVehicle('Mercedes-Benz Sprinter / Toyota HiAce');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.selling_price.toString());
    setStock(p.stock_quantity.toString());
    setCategory(p.category);
    setVehicle(p.compatible_vehicles?.join(' / ') || 'General / Universal');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please type the part name');
      return;
    }

    const sPrice = roundMoney(parseCediInput(price));
    if (sPrice <= 0) {
      setFormError('Please enter a selling price');
      return;
    }

    const stockQty = parseInt(stock, 10);
    if (isNaN(stockQty) || stockQty < 0) {
      setFormError('Please enter stock quantity');
      return;
    }

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, {
          name: name.trim(),
          category,
          selling_price: sPrice,
          stock_quantity: stockQty,
          compatible_vehicles: vehicle ? [vehicle] : ['General / Universal'],
        });
      } else {
        await productService.addProduct({
          name: name.trim(),
          category,
          selling_price: sPrice,
          cost_price: roundMoney(sPrice * 0.75),
          stock_quantity: stockQty,
          low_stock_threshold: 4,
          compatible_vehicles: vehicle ? [vehicle] : ['General / Universal'],
          image_url: null,
        });
      }

      setIsModalOpen(false);
      loadProducts();
    } catch {
      setFormError('Failed to save part. Please try again.');
    }
  };

  // Quick 1-tap stock update (+1, -1, +5)
  const handleQuickStock = async (productId: string, delta: number) => {
    try {
      const newQty = await productService.quickAdjustStock(productId, delta);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, stock_quantity: newQty } : p
        )
      );
      showToast(`Stock updated (${delta > 0 ? `+${delta}` : delta})`);
    } catch {
      showToast('Could not update stock.', 'error');
    }
  };

  // Quick Price Save
  const handleQuickPriceSave = async (productId: string) => {
    const val = roundMoney(parseCediInput(newPriceValue));
    if (val > 0) {
      await productService.quickUpdatePrice(productId, val);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, selling_price: val } : p))
      );
      showToast(`Price updated to ${formatCedi(val)}`);
    }
    setEditingPriceId(null);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await productService.deleteProduct(productToDelete.id);
      showToast(`Removed ${productToDelete.name}`);
      setProductToDelete(null);
      loadProducts();
    } catch {
      showToast('Could not delete part.', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
      
      {/* Toast Notification (Elevated Overlay) */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-xl border flex items-center gap-2 text-xs font-bold animate-in fade-in ${
            toast.type === 'error'
              ? 'bg-danger text-surface border-danger'
              : 'bg-surface text-primary border-border'
          }`}
        >
          <Check className="w-4 h-4 text-positive" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-5 rounded-lg border border-border">
        <div>
          <span className="text-xs font-semibold text-accent">
            Shop Stock
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-primary mt-0.5">
            Spare Parts & Stock
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Change stock quantities, update prices, or add new parts
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-3.5 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-sm flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4 text-surface" />
          <span>+ ADD NEW PART</span>
        </button>
      </div>

      {/* Simple Search & Filter */}
      <div className="bg-surface p-4 rounded-lg border border-border space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search part name (e.g. Brake pad, Sprinter filter)..."
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-border bg-surface text-sm text-primary outline-none font-medium focus:border-accent"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-accent text-surface border-accent'
                    : 'bg-surface-muted text-secondary border-border hover:bg-surface hover:text-primary'
                }`}
              >
                {cat}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition border flex items-center gap-1 ${
              lowStockOnly
                ? 'bg-danger text-surface border-danger'
                : 'bg-danger-soft text-danger border-danger'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock</span>
          </button>
        </div>
      </div>

      {/* Products Simple Cards List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="p-8 text-center text-secondary">Loading parts...</div>
        ) : products.length === 0 ? (
          <div className="bg-surface rounded-lg p-10 text-center border border-border space-y-3">
            <Boxes className="w-12 h-12 mx-auto opacity-30 text-secondary" />
            <div>
              <h4 className="font-bold text-base text-primary">No parts yet</h4>
              <p className="text-xs text-secondary mt-1">Tap + Add Product to start stocking your inventory.</p>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                setName('');
                setPrice('');
                setStock('');
                setCategory('Brakes');
                setVehicle('Mercedes-Benz Sprinter / Toyota HiAce');
                setFormError(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-xs inline-flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
            </button>
          </div>
        ) : (
          products.map((p) => {
            const isOutOfStock = p.stock_quantity <= 0;
            const isLow = p.stock_quantity <= p.low_stock_threshold && !isOutOfStock;
            const isEditingPrice = editingPriceId === p.id;

            return (
              <div
                key={p.id}
                className="bg-surface rounded-lg p-4 border border-border flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                {/* Part Name & Vehicle */}
                <div className="min-w-0 flex-1 flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-surface-muted border border-border text-accent shrink-0">
                    <CategoryIcon category={p.category} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-primary leading-tight">
                        {p.name}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-surface-muted text-secondary border border-border">
                        {p.category}
                      </span>
                    </div>

                    {p.compatible_vehicles && p.compatible_vehicles.length > 0 && (
                      <p className="text-xs text-secondary mt-1 flex items-center gap-1 font-medium">
                        <CarFront className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>{p.compatible_vehicles.join(' / ')}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Price & Stock Adjustment Section */}
                <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-5 pt-2.5 md:pt-0 border-t md:border-t-0 border-border">
                  
                  {/* Price */}
                  <div>
                    <span className="text-[10px] font-semibold text-secondary block">
                      Price
                    </span>
                    {!isEditingPrice ? (
                      <div 
                        onClick={() => {
                          setEditingPriceId(p.id);
                          setNewPriceValue(p.selling_price.toString());
                        }}
                        className="flex items-center gap-1 cursor-pointer group"
                        title="Click to edit price"
                      >
                        <span className="text-lg sm:text-xl font-black text-primary group-hover:text-accent transition">
                          {formatCedi(p.selling_price)}
                        </span>
                        <Edit2 className="w-3 h-3 text-secondary group-hover:text-accent" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          value={newPriceValue}
                          onChange={(e) => setNewPriceValue(e.target.value)}
                          className="w-22 px-2 py-1 border border-accent rounded-lg text-sm font-bold bg-surface text-primary outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleQuickPriceSave(p.id)}
                          className="p-1.5 bg-positive text-surface rounded-lg hover:opacity-90"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingPriceId(null)}
                          className="p-1.5 bg-surface-muted text-secondary rounded-lg border border-border hover:bg-surface"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stock Level with [-] and [+] buttons */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-secondary block mb-1">
                      In Stock
                    </span>

                    <div className="flex items-center gap-1 bg-surface-muted rounded-lg p-0.5 border border-border">
                      <button
                        type="button"
                        onClick={() => handleQuickStock(p.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface text-primary font-bold border border-border hover:bg-surface-muted transition"
                        title="Deduct 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-9 text-center px-1.5">
                        <span
                          className={`font-black text-sm ${
                            isOutOfStock
                              ? 'text-danger'
                              : isLow
                              ? 'text-warning'
                              : 'text-primary'
                          }`}
                        >
                          {p.stock_quantity}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickStock(p.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold transition"
                        title="Add 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick +5 restock pill */}
                    <button
                      type="button"
                      onClick={() => handleQuickStock(p.id, 5)}
                      className="mt-1 text-[10px] font-bold text-accent hover:text-accent-hover bg-accent-soft px-2 py-0.5 rounded-lg border border-border"
                    >
                      +5 Restock
                    </button>
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex items-center gap-1 border-l border-border pl-2.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-secondary hover:text-primary hover:bg-surface-muted rounded-lg transition"
                      title="Edit Part"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductToDelete(p)}
                      className="p-1.5 text-secondary hover:text-danger hover:bg-danger-soft rounded-lg transition"
                      title="Delete Part"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Part Modal (Elevated Surface) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-surface rounded-lg shadow-xl overflow-hidden border border-border animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-surface-muted border-b border-border p-5 flex items-center justify-between text-primary">
              <div>
                <h3 className="font-bold text-base">
                  {editingProduct ? 'Edit Spare Part' : '+ Add New Spare Part'}
                </h3>
                <p className="text-xs text-secondary mt-0.5">Quickly add parts to your counter</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-danger-soft border border-danger text-danger rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* 1. Name */}
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Part Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Brake Pad (Front)"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm font-bold text-primary outline-none focus:border-accent"
                  autoFocus
                />
              </div>

              {/* 2. Price */}
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Selling Price (GH₵) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 250.00"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-base font-black text-primary outline-none focus:border-accent"
                />
              </div>

              {/* 3. Stock */}
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Stock Quantity <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-base font-bold text-primary outline-none focus:border-accent"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface font-semibold text-sm text-primary outline-none focus:border-accent"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Compatibility */}
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Vehicle (Trotro / Van)
                </label>
                <input
                  type="text"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder="e.g. Mercedes-Benz Sprinter / Toyota HiAce"
                  className="w-full px-3.5 py-2 rounded-lg border border-border bg-surface text-xs text-primary outline-none focus:border-accent"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold text-secondary border border-border hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-surface font-bold text-xs transition"
                >
                  Save Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Elevated Surface) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full shadow-xl border border-border text-center space-y-4">
            <div className="w-12 h-12 bg-danger-soft border border-danger rounded-lg flex items-center justify-center mx-auto text-danger">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-primary">Remove Part?</h3>
              <p className="text-xs text-secondary mt-1">
                Are you sure you want to remove <strong>{productToDelete.name}</strong> from stock?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 rounded-lg bg-surface-muted border border-border text-secondary font-bold text-xs hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-lg bg-danger text-surface font-bold text-xs hover:opacity-90"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
