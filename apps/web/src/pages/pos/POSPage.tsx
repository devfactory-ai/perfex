/**
 * Point of Sale (POS) Page
 * Bakery sales interface for quick transactions
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Product {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  currency: string;
  sku: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface PointOfSale {
  id: string;
  name: string;
  location: string;
}

// Product categories for bakery - labels are translation keys
const CATEGORY_IDS = [
  { id: 'all', key: 'all', color: 'bg-gray-100 text-gray-800' },
  { id: 'pain', key: 'breads', color: 'bg-amber-100 text-amber-800' },
  { id: 'viennoiserie', key: 'viennoiseries', color: 'bg-orange-100 text-orange-800' },
  { id: 'patisserie', key: 'pastries', color: 'bg-pink-100 text-pink-800' },
  { id: 'autre', key: 'other', color: 'bg-blue-100 text-blue-800' },
];

export function POSPage() {
  const { t } = useLanguage();
  const [selectedPOS, setSelectedPOS] = useState<string>('');
  const [sessionOpen, setSessionOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products (inventory items with category finished_product)
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['pos-products'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Product[]>>('/inventory/items?category=finished_product&active=true');
      return response.data.data || [];
    },
  });

  // Fetch points of sale (mock for now, can be extended)
  const pointsOfSale: PointOfSale[] = useMemo(() => [
    { id: 'pos-1', name: 'Boutique Principale', location: '45 Rue du Commerce, 75015 Paris' },
    { id: 'pos-2', name: 'Kiosque Marché Aligre', location: "Marché d'Aligre, 75012 Paris" },
  ], []);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Cart calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.product.sellingPrice * item.quantity), 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleOpenSession = () => {
    if (!selectedPOS) {
      alert(t('pos.selectPOSAlert'));
      return;
    }
    setSessionOpen(true);
  };

  const handleCloseSession = () => {
    if (cart.length > 0) {
      if (!confirm(t('pos.cartNotEmptyConfirm'))) {
        return;
      }
    }
    setSessionOpen(false);
    clearCart();
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert(t('pos.emptyCartAlert'));
      return;
    }
    // In a real implementation, this would create a sales transaction
    alert(`${t('pos.saleRecorded')}\n${t('pos.total')}: ${cartTotal.toFixed(2)} EUR\n${t('pos.items')}: ${cartItemCount}`);
    clearCart();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // If no session is open, show the session selection screen
  if (!sessionOpen) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-card border rounded-xl p-8 max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🏪</div>
            <h1 className="text-2xl font-bold">{t('pos.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('pos.selectLocation')}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">{t('pos.pointOfSale')}</label>
            <select
              value={selectedPOS}
              onChange={(e) => setSelectedPOS(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm"
            >
              <option value="">{t('pos.selectPOS')}</option>
              {pointsOfSale.map(pos => (
                <option key={pos.id} value={pos.id}>{pos.name}</option>
              ))}
            </select>
            {selectedPOS && (
              <p className="text-xs text-muted-foreground">
                📍 {pointsOfSale.find(p => p.id === selectedPOS)?.location}
              </p>
            )}
          </div>

          <button
            onClick={handleOpenSession}
            disabled={!selectedPOS}
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pos.openSession')}
          </button>
        </div>
      </div>
    );
  }

  // Main POS interface
  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col bg-card border rounded-lg overflow-hidden">
        {/* Header with search and session info */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {pointsOfSale.find(p => p.id === selectedPOS)?.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                {t('pos.sessionOpen')}
              </span>
            </div>
            <button
              onClick={handleCloseSession}
              className="text-sm text-muted-foreground hover:text-destructive"
            >
              {t('pos.closeSession')}
            </button>
          </div>
          <input
            type="text"
            placeholder={t('pos.searchProduct')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 p-3 border-b overflow-x-auto">
          {CATEGORY_IDS.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? cat.color + ' ring-2 ring-offset-1 ring-primary'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {t(`pos.categories.${cat.key}`)}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <span className="text-4xl mb-2">📦</span>
              <p>{t('pos.noProductsFound')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-4 rounded-lg border bg-background hover:bg-muted/50 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="text-2xl mb-2">
                    {product.category === 'pain' ? '🥖' :
                     product.category === 'viennoiserie' ? '🥐' :
                     product.category === 'patisserie' ? '🍰' : '🧁'}
                  </div>
                  <div className="font-medium text-sm line-clamp-2 group-hover:text-primary">
                    {product.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {product.sku}
                  </div>
                  <div className="font-bold text-primary mt-2">
                    {formatCurrency(product.sellingPrice)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 flex flex-col bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h2 className="font-semibold flex items-center gap-2">
            <span>🛒</span>
            {t('pos.cart')}
            {cartItemCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">
                {cartItemCount}
              </span>
            )}
          </h2>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <span className="text-4xl mb-2">🛒</span>
              <p className="text-sm">{t('pos.emptyCart')}</p>
              <p className="text-xs mt-1">{t('pos.addToCart')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(item.product.sellingPrice)} × {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded bg-background border flex items-center justify-center hover:bg-muted"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded bg-background border flex items-center justify-center hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                  <div className="font-medium text-sm w-20 text-right">
                    {formatCurrency(item.product.sellingPrice * item.quantity)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart footer with total and checkout */}
        <div className="border-t p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('pos.subtotal')}</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
          <div className="flex items-center justify-between font-bold text-lg">
            <span>{t('pos.total')}</span>
            <span className="text-primary">{formatCurrency(cartTotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="rounded-md border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {t('pos.cancel')}
            </button>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {t('pos.checkout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
