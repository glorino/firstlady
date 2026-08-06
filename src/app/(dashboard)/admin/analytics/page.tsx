"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } } as const;
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/sales?limit=200").then((r) => r.json()),
      fetch("/api/products?limit=200").then((r) => r.json()),
      fetch("/api/customers?limit=200").then((r) => r.json()),
    ]).then(([salesRes, productsRes, customersRes]) => {
      const sales = salesRes.data || salesRes;
      const products = productsRes.data || productsRes;
      const customers = customersRes.data || customersRes;
      const COMPLETED_SALES = sales.filter((s: any) => s.status === "COMPLETED" || s.status === "PENDING");

      // Top products
      const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
      for (const sale of COMPLETED_SALES) {
        for (const item of sale.items || []) {
          const name = item.product?.name || "Unknown";
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name, sales: 0, revenue: 0 };
          }
          productSales[item.productId].sales += item.quantity;
          productSales[item.productId].revenue += Number(item.total);
        }
      }
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Payment method breakdown
      const paymentMethods: Record<string, number> = {};
      for (const sale of COMPLETED_SALES) {
        paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + 1;
      }
      const totalSales = COMPLETED_SALES.length || 1;
      const salesByPayment = Object.entries(paymentMethods).map(([name, count]) => ({
        name,
        value: Math.round((count / totalSales) * 100),
        color: COLORS[Object.keys(paymentMethods).indexOf(name) % COLORS.length],
      }));

      // Hourly pattern from sale times
      const hourlyData: Record<string, number> = {};
      for (let h = 8; h <= 18; h++) {
        hourlyData[`${h > 12 ? h - 12 : h}${h >= 12 ? "PM" : "AM"}`] = 0;
      }
      for (const sale of COMPLETED_SALES) {
        const hour = new Date(sale.createdAt).getHours();
        if (hour >= 8 && hour <= 18) {
          const label = `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "PM" : "AM"}`;
          hourlyData[label] = (hourlyData[label] || 0) + 1;
        }
      }
      const hourlySales = Object.entries(hourlyData).map(([hour, count]) => ({ hour, sales: count }));

      const totalRevenue = COMPLETED_SALES.reduce((s: number, sale: any) => s + Number(sale.totalAmount), 0);
      const avgOrder = COMPLETED_SALES.length > 0 ? totalRevenue / COMPLETED_SALES.length : 0;
      const activeProducts = products.filter((p: any) => p.isActive);

      setData({
        stats: {
          avgOrderValue: avgOrder,
          totalCustomers: customers.length,
          totalProducts: activeProducts.length,
          totalSales: COMPLETED_SALES.length,
        },
        topProducts,
        salesByPayment,
        hourlySales,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Business intelligence and insights</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg. Order Value", value: formatCurrency(data?.stats?.avgOrderValue || 0) },
          { label: "Total Customers", value: String(data?.stats?.totalCustomers || 0) },
          { label: "Active Products", value: String(data?.stats?.totalProducts || 0) },
          { label: "Completed Sales", value: String(data?.stats?.totalSales || 0) },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.topProducts?.length > 0 ? (
                  data.topProducts.map((p: any, i: number) => (
                    <div key={p.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-sm text-gray-500">{p.sales} units sold</p>
                      </div>
                      <span className="font-semibold text-blue-600">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No sales data yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle>Hourly Sales Pattern</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.hourlySales || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle>Sales by Payment Method</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="h-64 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.salesByPayment || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {(data?.salesByPayment || []).map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="ml-8 space-y-3">
                {(data?.salesByPayment || []).map((p: any) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-sm text-gray-600">{p.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{p.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
