"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Package, DollarSign, BarChart3, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const topProducts = [
  { name: "First Lady Red Palm Olein (5L)", sales: 120, revenue: 780000 },
  { name: "First Lady Red Palm Olein (3L)", sales: 85, revenue: 340000 },
  { name: "Purewave Soap (Family Pack)", sales: 95, revenue: 114000 },
  { name: "Purewave Cream (Large)", sales: 60, revenue: 132000 },
  { name: "First Lady Red Palm Olein (1L)", sales: 110, revenue: 165000 },
];

const hourlySales = [
  { hour: "9AM", sales: 12 }, { hour: "10AM", sales: 19 }, { hour: "11AM", sales: 25 },
  { hour: "12PM", sales: 32 }, { hour: "1PM", sales: 28 }, { hour: "2PM", sales: 35 },
  { hour: "3PM", sales: 22 }, { hour: "4PM", sales: 18 }, { hour: "5PM", sales: 15 },
];

const salesByPayment = [
  { name: "Cash", value: 45, color: "#10b981" },
  { name: "Card", value: 30, color: "#3b82f6" },
  { name: "Mobile", value: 25, color: "#8b5cf6" },
];

export default function AnalyticsPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Business intelligence and insights</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg. Order Value", value: formatCurrency(35750), change: "+5.2%", color: "blue" },
          { label: "Conversion Rate", value: "68.5%", change: "+2.1%", color: "emerald" },
          { label: "Customer Retention", value: "85.3%", change: "+1.8%", color: "purple" },
          { label: "Revenue/Employee", value: formatCurrency(250000), change: "+8.5%", color: "amber" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <Badge variant="success" className="mt-2">{stat.change}</Badge>
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
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.sales} units sold</p>
                    </div>
                    <span className="font-semibold text-blue-600">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
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
                  <BarChart data={hourlySales}>
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
                    <Pie data={salesByPayment} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {salesByPayment.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="ml-8 space-y-3">
                {salesByPayment.map((p) => (
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
