"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Loader2, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const monthlyData = [
  { month: "Jan", revenue: 380000, cogs: 245000, expenses: 45000, profit: 90000 },
  { month: "Feb", revenue: 420000, cogs: 270000, expenses: 48000, profit: 102000 },
  { month: "Mar", revenue: 395000, cogs: 255000, expenses: 46000, profit: 94000 },
  { month: "Apr", revenue: 480000, cogs: 310000, expenses: 52000, profit: 118000 },
  { month: "May", revenue: 450000, cogs: 290000, expenses: 50000, profit: 110000 },
  { month: "Jun", revenue: 520000, cogs: 335000, expenses: 55000, profit: 130000 },
];

export default function ProfitLossPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const totalCogs = monthlyData.reduce((s, d) => s + d.cogs, 0);
  const totalExpenses = monthlyData.reduce((s, d) => s + d.expenses, 0);
  const totalProfit = monthlyData.reduce((s, d) => s + d.profit, 0);
  const margin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h1><p className="text-gray-500 mt-1">Financial performance overview</p></div>
        <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export Report</Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "blue", change: "+12.5%" },
          { label: "Cost of Goods", value: formatCurrency(totalCogs), icon: TrendingDown, color: "amber", change: "+8.2%" },
          { label: "Operating Expenses", value: formatCurrency(totalExpenses), icon: TrendingDown, color: "red", change: "+3.1%" },
          { label: "Net Profit", value: formatCurrency(totalProfit), icon: TrendingUp, color: "emerald", change: "+18.7%", extra: `${margin}% margin` },
        ].map((stat) => (
          <motion.div variants={item} key={stat.label}>
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `bg-${stat.color}-50`)}>
                    <stat.icon className={cn("w-5 h-5", `text-${stat.color}-600`)} />
                  </div>
                  <Badge variant="success">{stat.change}</Badge>
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                {stat.extra && <p className="text-xs text-emerald-500 mt-1">{stat.extra}</p>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

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
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
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
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
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

      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle>Monthly Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Revenue</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">COGS</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Gross Profit</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Expenses</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Net Profit</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Margin</th>
                </tr></thead>
                <tbody>
                  {monthlyData.map((d) => {
                    const grossProfit = d.revenue - d.cogs;
                    const margin = ((d.profit / d.revenue) * 100).toFixed(1);
                    return (
                      <tr key={d.month} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium">{d.month}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(d.revenue)}</td>
                        <td className="py-3 px-4 text-right text-amber-600">{formatCurrency(d.cogs)}</td>
                        <td className="py-3 px-4 text-right text-blue-600">{formatCurrency(grossProfit)}</td>
                        <td className="py-3 px-4 text-right text-red-600">{formatCurrency(d.expenses)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600">{formatCurrency(d.profit)}</td>
                        <td className="py-3 px-4 text-right"><Badge variant="success">{margin}%</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr className="border-t-2 border-gray-200 font-bold">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(totalRevenue)}</td>
                  <td className="py-3 px-4 text-right text-amber-600">{formatCurrency(totalCogs)}</td>
                  <td className="py-3 px-4 text-right text-blue-600">{formatCurrency(totalRevenue - totalCogs)}</td>
                  <td className="py-3 px-4 text-right text-red-600">{formatCurrency(totalExpenses)}</td>
                  <td className="py-3 px-4 text-right text-emerald-600">{formatCurrency(totalProfit)}</td>
                  <td className="py-3 px-4 text-right"><Badge variant="success">{margin}%</Badge></td>
                </tr></tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
