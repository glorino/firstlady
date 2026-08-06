"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart, Package, Users, TrendingUp, DollarSign, AlertTriangle,
  ArrowUpRight, ArrowDownRight, BarChart3, Wallet, ShoppingBag, Box
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getGreeting, cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Demo data for charts
const salesData = [
  { name: "Mon", sales: 4000, profit: 2400 },
  { name: "Tue", sales: 3000, profit: 1398 },
  { name: "Wed", sales: 5000, profit: 3800 },
  { name: "Thu", sales: 2780, profit: 1908 },
  { name: "Fri", sales: 1890, profit: 1200 },
  { name: "Sat", sales: 6390, profit: 4200 },
  { name: "Sun", sales: 3490, profit: 2100 },
];

const categoryData = [
  { name: "Food & Cooking Oils", value: 4000, color: "#f59e0b" },
  { name: "Toiletries & Personal Care", value: 3000, color: "#3b82f6" },
  { name: "Others", value: 500, color: "#8b5cf6" },
];

const recentSales = [
  { id: 1, customer: "Mama Ngozi Store", amount: 130000, items: 20, product: "First Lady Red Palm Olein (5L)", date: "2024-01-15T10:30:00", status: "completed" },
  { id: 2, customer: "Kemi Supermarket", amount: 65000, items: 10, product: "First Lady Red Palm Olein (5L)", date: "2024-01-15T09:15:00", status: "completed" },
  { id: 3, customer: "Ibrahim General Store", amount: 36000, items: 30, product: "Purewave Soap (Family Pack)", date: "2024-01-15T08:45:00", status: "completed" },
  { id: 4, customer: "Funke Provisions", amount: 33000, items: 15, product: "Purewave Cream (Large)", date: "2024-01-14T16:20:00", status: "completed" },
  { id: 5, customer: "Emeka Mini Market", amount: 100000, items: 25, product: "First Lady Red Palm Olein (3L)", date: "2024-01-14T14:10:00", status: "completed" },
];

const lowStockProducts = [
  { name: "First Lady Red Palm Olein (3L)", sku: "FLO-00002", stock: 150, min: 40 },
  { name: "Purewave Soap (Regular)", sku: "PWV-00002", stock: 250, min: 60 },
  { name: "Purewave Cream (Large)", sku: "PWC-00001", stock: 120, min: 30 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-gray-600">
            {entry.name}: {formatCurrency(Number(entry.value))}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role || "SALES";
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div variants={item}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
          <h1 className="text-2xl font-bold">{getGreeting()}, {user?.name}!</h1>
          <p className="text-blue-100 mt-1">Here's what's happening with your business today.</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Today's Sales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(245000)}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 font-medium ml-1">+12.5%</span>
                    <span className="text-gray-400 ml-1">vs yesterday</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(1250000)}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 font-medium ml-1">+8.2%</span>
                    <span className="text-gray-400 ml-1">this month</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Products</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">248</p>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="text-amber-500 font-medium">4 low stock</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Net Profit</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(385000)}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 font-medium ml-1">+18.7%</span>
                    <span className="text-gray-400 ml-1">margin: 30.8%</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sales Overview</CardTitle>
                <Badge variant="secondary">This Week</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Pie Chart */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-gray-600">{cat.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Sales</CardTitle>
                <Badge>{recentSales.length} today</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {sale.customer.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sale.customer}</p>
                        <p className="text-xs text-gray-400">{sale.product} ({sale.items} units)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.amount)}</p>
                      <Badge variant={sale.status === "completed" ? "success" : "destructive"} className="mt-1">
                        {sale.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alert */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Low Stock Alerts
                </CardTitle>
                <Badge variant="warning">{lowStockProducts.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.sku} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">{product.stock} left</p>
                      <p className="text-xs text-gray-400">Min: {product.min}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
