"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Plus, Minus, CreditCard, Banknote,
  Smartphone, Package, Loader2, CheckCircle2, Lock, AlertCircle, DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, cn } from "@/lib/utils";
import { CartItem, PaymentMethod } from "@/types";

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [cashRegisterOpen, setCashRegisterOpen] = useState(false);
  const [checkingRegister, setCheckingRegister] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const [taxRate, setTaxRate] = useState(7.5);

  const checkCashRegister = async () => {
    try {
      const res = await fetch("/api/cash-register?status=OPEN");
      const json = await res.json();
      const registers = json.data || json;
      setCashRegisterOpen(registers.length > 0);
    } catch (error) {
      console.error("Failed to check cash register:", error);
      setCashRegisterOpen(false);
    } finally {
      setCheckingRegister(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/products?limit=200").then((r) => r.json()),
      fetch("/api/categories?limit=200").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([products, categories, settings]) => {
      setProducts(products.data || products);
      setCategories(categories.data || categories);
      if (settings.taxRate) setTaxRate(Number(settings.taxRate));
    }).catch(() => {}).finally(() => setLoading(false));
    
    checkCashRegister();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=200");
      const json = await res.json();
      setProducts(json.data || json);
    } catch (error) {
      console.error("Failed to fetch products");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
    return matchesSearch && matchesCategory && p.isActive;
  });

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.sellingPrice),
          costPrice: Number(product.costPrice),
          quantity: 1,
          maxQuantity: product.stockQuantity,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.maxQuantity) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  const change = parseFloat(amountPaid || "0") - total;

  const processSale = async () => {
    if (!amountPaid || parseFloat(amountPaid) < total) return;
    setProcessing(true);
    setSaleError("");

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            costPrice: item.costPrice,
          })),
          paymentMethod,
          amountPaid: parseFloat(amountPaid),
          taxRate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        timeoutRef.current = setTimeout(() => {
          setCart([]);
          setShowPayment(false);
          setSuccess(false);
          setAmountPaid("");
          fetchProducts();
        }, 2000);
      } else {
        setSaleError(data.error || "Failed to process sale");
      }
    } catch (error) {
      setSaleError("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

const handleProceedToPayment = () => {
    if (!cashRegisterOpen) {
      setShowPayment(false);
      return;
    }
    setAmountPaid(total.toFixed(2));
    setShowPayment(true);
  };

  if (checkingRegister) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-gray-500">Checking cash register...</p>
        </div>
      </div>
    );
  }

  if (!cashRegisterOpen) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cash Register Closed</h2>
            <p className="text-gray-500 mb-6">
              You must open a cash register before using the POS terminal.
              Please open a register to start recording sales.
            </p>
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => window.location.href = "/sales/cash-register"}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Open Cash Register
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              Or navigate to Sales → Cash Register from the sidebar
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 overflow-hidden">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search & Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => addToCart(product)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all duration-200",
                      product.stockQuantity <= 0
                        ? "border-red-200 bg-red-50/50 opacity-60 cursor-not-allowed"
                        : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer"
                    )}
                    disabled={product.stockQuantity <= 0}
                  >
                    <div className="w-full h-28 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-3 overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-gray-300" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(Number(product.sellingPrice))}
                      </span>
                      <Badge variant={product.stockQuantity > 10 ? "success" : product.stockQuantity > 0 ? "warning" : "destructive"}>
                        {product.stockQuantity} in stock
                      </Badge>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="w-96 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Cart Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Current Order</h2>
          </div>
          <Badge>{cart.length} items</Badge>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Click products to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Cart Summary */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax ({taxRate}%)</span>
            <span className="font-medium">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-3">
            <span>Total</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0}
            onClick={handleProceedToPayment}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Proceed to Payment
          </Button>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-8"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
              <p className="text-gray-500 mt-1">Sale has been recorded</p>
            </motion.div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Complete Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-50 text-center">
                  <p className="text-sm text-gray-500">Amount Due</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(total)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["CASH", "CARD", "TRANSFER", "MOBILE"] as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                          paymentMethod === method
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {method === "CASH" && <Banknote className="w-5 h-5" />}
                        {method === "CARD" && <CreditCard className="w-5 h-5" />}
                        {method === "MOBILE" && <Smartphone className="w-5 h-5" />}
                        {method === "TRANSFER" && <Banknote className="w-5 h-5" />}
                        <span className="text-xs font-medium">{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Amount Paid"
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  min={total}
                />

                {parseFloat(amountPaid) >= total && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Change</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(change)}</span>
                    </div>
                  </div>
                )}

                {saleError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                    {saleError}
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={processSale}
                  disabled={!amountPaid || parseFloat(amountPaid) < total || processing}
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  )}
                  Complete Sale
                </Button>
              </div>
            </>
          )}
        </DialogContent></Dialog>
    </div>
  );
}
