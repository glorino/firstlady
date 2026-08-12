"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatCurrencyShort, cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } } as const;
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const STAT_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-600" },
  { bg: "bg-amber-50", text: "text-amber-600" },
  { bg: "bg-red-50", text: "text-red-600" },
  { bg: "bg-emerald-50", text: "text-emerald-600" },
];

export default function ProfitLossPage() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/sales?limit=200").then((r) => r.json()),
      fetch("/api/expenses?limit=200").then((r) => r.json()),
    ]).then(([salesRes, expensesRes]) => {
      const sales = salesRes.data || salesRes;
      const expenses = expensesRes.data || expensesRes;
      const COMPLETED_SALES = sales.filter((s: any) => s.status === "COMPLETED");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyMap: Record<string, { revenue: number; cogs: number; expenses: number; profit: number }> = {};

      for (const sale of COMPLETED_SALES) {
        const d = new Date(sale.createdAt);
        const key = months[d.getMonth()];
        if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, cogs: 0, expenses: 0, profit: 0 };
        monthlyMap[key].revenue += Number(sale.totalAmount);
        for (const item of sale.items || []) {
          monthlyMap[key].cogs += Number(item.costPrice) * item.quantity;
        }
      }

      for (const exp of expenses) {
        const d = new Date(exp.date || exp.createdAt);
        const key = months[d.getMonth()];
        if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, cogs: 0, expenses: 0, profit: 0 };
        monthlyMap[key].expenses += Number(exp.amount);
      }

      const data = Object.entries(monthlyMap)
        .map(([month, vals]) => ({
          month,
          revenue: vals.revenue,
          cogs: vals.cogs,
          expenses: vals.expenses,
          profit: vals.revenue - vals.cogs - vals.expenses,
        }))
        .filter((d) => d.revenue > 0 || d.expenses > 0);

      setMonthlyData(data);
      setLoading(false);
    }).catch((e) => { console.error("Failed to fetch P&L data:", e); setLoading(false); });
  }, []);

  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const totalCogs = monthlyData.reduce((s, d) => s + d.cogs, 0);
  const totalExpenses = monthlyData.reduce((s, d) => s + d.expenses, 0);
  const totalProfit = monthlyData.reduce((s, d) => s + d.profit, 0);
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

  const stats = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, colorIdx: 0 },
    { label: "Cost of Goods", value: formatCurrency(totalCogs), icon: TrendingDown, colorIdx: 1 },
    { label: "Operating Expenses", value: formatCurrency(totalExpenses), icon: TrendingDown, colorIdx: 2 },
    { label: "Net Profit", value: formatCurrency(totalProfit), icon: TrendingUp, colorIdx: 3, extra: `${margin}% margin` },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h1>
        <p className="text-gray-500 mt-1">Financial performance overview</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const colors = STAT_COLORS[stat.colorIdx];
          return (
            <motion.div variants={item} key={stat.label}>
              <Card hover>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.bg)}>
                      <stat.icon className={cn("w-5 h-5", colors.text)} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.extra && <p className="text-xs text-emerald-500 mt-1">{stat.extra}</p>}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {monthlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={item}>
            <Card>
              <CardHeader><CardTitle>Revenue vs Profit Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `N${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `N${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      <Bar dataKey="cogs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {monthlyData.length > 0 && (
        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle>Monthly Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Month</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Revenue</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">COGS</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Gross Profit</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Expenses</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Net Profit</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((d) => {
                      const grossProfit = d.revenue - d.cogs;
                      const m = d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : "0";
                      return (
                        <tr key={d.month} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-medium">{d.month}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(d.revenue)}</td>
                          <td className="py-3 px-4 text-right text-amber-600">{formatCurrency(d.cogs)}</td>
                          <td className="py-3 px-4 text-right text-blue-600">{formatCurrency(grossProfit)}</td>
                          <td className="py-3 px-4 text-right text-red-600">{formatCurrency(d.expenses)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-600">{formatCurrency(d.profit)}</td>
                          <td className="py-3 px-4 text-right"><Badge variant="success">{m}%</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 font-bold">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(totalRevenue)}</td>
                      <td className="py-3 px-4 text-right text-amber-600">{formatCurrency(totalCogs)}</td>
                      <td className="py-3 px-4 text-right text-blue-600">{formatCurrency(totalRevenue - totalCogs)}</td>
                      <td className="py-3 px-4 text-right text-red-600">{formatCurrency(totalExpenses)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600">{formatCurrency(totalProfit)}</td>
                      <td className="py-3 px-4 text-right"><Badge variant="success">{margin}%</Badge></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {monthlyData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            No financial data yet. Record sales and expenses to see your P&L statement.
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
