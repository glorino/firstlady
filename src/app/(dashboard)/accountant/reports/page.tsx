"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const reports = [
  { id: 1, name: "Daily Sales Report", description: "Complete breakdown of daily sales transactions", icon: BarChart3, lastGenerated: "2024-01-15", color: "blue" },
  { id: 2, name: "Inventory Status Report", description: "Current stock levels and valuation", icon: PieChart, lastGenerated: "2024-01-14", color: "emerald" },
  { id: 3, name: "Profit & Loss Report", description: "Monthly revenue, costs, and profit analysis", icon: TrendingUp, lastGenerated: "2024-01-13", color: "purple" },
  { id: 4, name: "Customer Report", description: "Customer purchase history and outstanding balances", icon: FileText, lastGenerated: "2024-01-12", color: "amber" },
  { id: 5, name: "Expense Report", description: "Detailed expense breakdown by category", icon: FileText, lastGenerated: "2024-01-11", color: "red" },
  { id: 6, name: "Stock Movement Report", description: "All inventory in/out movements", icon: FileText, lastGenerated: "2024-01-10", color: "indigo" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("monthly");

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Reports</h1><p className="text-gray-500 mt-1">Generate and download business reports</p></div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <motion.div variants={item} key={report.id}>
            <Card hover className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-${report.color}-50 flex items-center justify-center`}>
                    <report.icon className={`w-6 h-6 text-${report.color}-600`} />
                  </div>
                  <Badge variant="outline">PDF</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{report.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Last: {report.lastGenerated}</span>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
