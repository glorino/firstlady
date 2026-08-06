"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Package, DollarSign, TrendingUp, AlertTriangle,
  Search, Sparkles, Brain, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getGreeting, cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } } as const;
const cardItem = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, damping: 20, stiffness: 200 } },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm text-gray-600">
            {entry.name}: {formatCurrency(Number(entry.value))}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role || "SALES";
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [salesSearch, setSalesSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [filterLoading, setFilterLoading] = useState(false);

  const showFinancials = role === "ADMIN" || role === "ACCOUNTANT";

  const fetchDashboard = useCallback(async (filter: string, isFilterChange = false) => {
    if (isFilterChange) setFilterLoading(true);
    try {
      const res = await fetch(`/api/dashboard?filter=${filter}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard");
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchDashboard("all");
  }, [fetchDashboard]);

  useEffect(() => {
    if (mounted) {
      fetchDashboard(dateFilter, true);
    }
  }, [dateFilter, fetchDashboard, mounted]);

  const filteredSales = useMemo(() => {
    if (!data?.recentSales) return [];
    if (!salesSearch) return data.recentSales;
    const q = salesSearch.toLowerCase();
    return data.recentSales.filter(
      (s: any) => s.customer.toLowerCase().includes(q) || s.product.toLowerCase().includes(q)
    );
  }, [data, salesSearch]);

  const filteredStock = useMemo(() => {
    if (!data?.lowStockProducts) return [];
    if (!stockSearch) return data.lowStockProducts;
    const q = stockSearch.toLowerCase();
    return data.lowStockProducts.filter(
      (p: any) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [data, stockSearch]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const salesChart = data?.salesChart || [];
  const categoryChart = data?.categoryChart || [];
  const insights = data?.insights || [];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={cardItem}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
          <motion.h1
            className="text-2xl font-bold"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {getGreeting()}, {user?.name}!
          </motion.h1>
          <motion.p
            className="text-blue-100 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Here&apos;s what&apos;s happening with your business {dateFilter === "today" ? "today" : dateFilter === "week" ? "this week" : dateFilter === "month" ? "this month" : ""}.
          </motion.p>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div variants={cardItem}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Filter by period</p>
              <div className="flex gap-2">
                {DATE_FILTERS.map((f) => (
                  <motion.button
                    key={f.value}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDateFilter(f.value)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      dateFilter === f.value
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {f.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards — Admin & Accountant only */}
      {showFinancials && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Period Sales", value: formatCurrency(stats.todayRevenue || 0), sub: `${stats.todaySalesCount || 0} transactions`, icon: ShoppingCart, bg: "bg-blue-50", iconColor: "text-blue-600" },
            { label: "Total Revenue", value: formatCurrency(stats.totalRevenue || 0), sub: `${stats.totalSalesCount || 0} total sales`, icon: DollarSign, bg: "bg-emerald-50", iconColor: "text-emerald-600" },
            { label: "Products", value: String(stats.totalProducts || 0), sub: `${stats.lowStockCount || 0} low stock`, icon: Package, bg: "bg-amber-50", iconColor: "text-amber-600" },
            { label: "Net Profit", value: formatCurrency(stats.profit || 0), sub: `margin: ${stats.totalRevenue > 0 ? ((stats.profit / stats.totalRevenue) * 100).toFixed(1) : 0}%`, icon: TrendingUp, bg: "bg-purple-50", iconColor: "text-purple-600" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={cardItem}
              custom={i}
              initial="hidden"
              animate="show"
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card hover>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={stat.value}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.3 }}
                          className="text-2xl font-bold text-gray-900 mt-1"
                        >
                          {stat.value}
                        </motion.p>
                      </AnimatePresence>
                      <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                    </div>
                    <motion.div
                      className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* AI Business Insights */}
      {insights.length > 0 && (
        <motion.div variants={cardItem}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                  AI Business Insights
                </CardTitle>
                <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">Live</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={container} initial="hidden" animate="show">
                {insights.map((insight: any, i: number) => (
                  <motion.div
                    key={insight.id}
                    variants={cardItem}
                    custom={i}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    className={cn(
                      "p-4 rounded-xl border transition-all hover:shadow-md",
                      insight.type === "positive" && "bg-emerald-50/50 border-emerald-100",
                      insight.type === "warning" && "bg-amber-50/50 border-amber-100",
                      insight.type === "info" && "bg-blue-50/50 border-blue-100"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        insight.type === "positive" && "bg-emerald-100",
                        insight.type === "warning" && "bg-amber-100",
                        insight.type === "info" && "bg-blue-100"
                      )}>
                        {insight.type === "positive" && <TrendingUp className="w-5 h-5 text-emerald-600" />}
                        {insight.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                        {insight.type === "info" && <Brain className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{insight.insight}</p>
                        <p className={cn(
                          "text-xs font-medium mt-2",
                          insight.type === "positive" && "text-emerald-600",
                          insight.type === "warning" && "text-amber-600",
                          insight.type === "info" && "text-blue-600"
                        )}>{insight.action}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={cardItem} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sales Overview</CardTitle>
                <Badge variant="secondary">
                  {filterLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  {DATE_FILTERS.find((f) => f.value === dateFilter)?.label || "All Time"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={dateFilter}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesChart}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                      <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardItem}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={dateFilter + "-cat"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryChart} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {categoryChart.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
              <div className="space-y-2 mt-4">
                {categoryChart.map((cat: any, i: number) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600">{cat.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(cat.value)}</span>
                  </motion.div>
                ))}
                {categoryChart.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No sales data for this period</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <motion.div variants={cardItem}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Sales</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search sales..."
                      value={salesSearch}
                      onChange={(e) => setSalesSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                    />
                  </div>
                  <Badge>{filteredSales.length}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={dateFilter + "-sales"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {filteredSales.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No sales for this period</p>
                  ) : (
                    filteredSales.map((sale: any, i: number) => (
                      <motion.div
                        key={sale.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                            {sale.customer.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{sale.customer}</p>
                            <p className="text-xs text-gray-400">{sale.product} ({sale.items} units)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {showFinancials && (
                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.amount)}</p>
                          )}
                          <Badge variant={sale.status === "COMPLETED" ? "success" : "destructive"} className="mt-1">
                            {sale.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alert */}
        <motion.div variants={cardItem}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </motion.div>
                  Low Stock Alerts
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                    />
                  </div>
                  <Badge variant="warning">{filteredStock.length} items</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredStock.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">All stock levels healthy</p>
                ) : (
                  filteredStock.map((product: any, i: number) => (
                    <motion.div
                      key={product.sku}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">{product.stock} left</p>
                        <p className="text-xs text-gray-400">Min: {product.min}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
