"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, BarChart3, PieChart, TrendingUp, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } } as const;
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

type ReportDef = {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  fetcher: (period: string) => Promise<{ columns: string[]; data: (string | number)[][] }>;
};

const REPORTS: ReportDef[] = [
  {
    id: "daily-sales",
    name: "Daily Sales Report",
    description: "Complete breakdown of sales transactions",
    icon: BarChart3,
    color: "blue",
    fetcher: async (period) => {
      const res = await fetch("/api/sales");
      const sales = await res.json();
      return {
        columns: ["Invoice", "Customer", "Items", "Amount", "Payment", "Status", "Date"],
        data: sales.map((s: any) => [
          s.invoiceNumber,
          s.customer?.name || "Walk-in",
          String(s.items?.length || 0),
          formatCurrency(Number(s.totalAmount)),
          s.paymentMethod,
          s.status,
          formatDate(s.createdAt),
        ]),
      };
    },
  },
  {
    id: "inventory",
    name: "Inventory Status Report",
    description: "Current stock levels and valuation",
    icon: PieChart,
    color: "emerald",
    fetcher: async () => {
      const res = await fetch("/api/products");
      const products = await res.json();
      return {
        columns: ["Product", "SKU", "Stock", "Min Level", "Price", "Total Value", "Status"],
        data: products.map((p: any) => [
          p.name,
          p.sku,
          String(p.currentStock),
          String(p.minStockLevel),
          formatCurrency(Number(p.sellingPrice)),
          formatCurrency(Number(p.sellingPrice) * p.currentStock),
          p.currentStock <= p.minStockLevel ? "Low" : "Good",
        ]),
      };
    },
  },
  {
    id: "profit-loss",
    name: "Profit & Loss Report",
    description: "Revenue, costs, and profit analysis",
    icon: TrendingUp,
    color: "purple",
    fetcher: async () => {
      const [salesRes, productsRes, expensesRes] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/products"),
        fetch("/api/expenses"),
      ]);
      const sales = await salesRes.json();
      const products = await productsRes.json();
      const expenses = await expensesRes.json();

      const categoryMap: Record<string, { revenue: number; cost: number }> = {};
      for (const s of sales) {
        for (const item of s.items || []) {
          const cat = item.product?.category?.name || "Uncategorized";
          if (!categoryMap[cat]) categoryMap[cat] = { revenue: 0, cost: 0 };
          categoryMap[cat].revenue += Number(item.unitPrice) * item.quantity;
          categoryMap[cat].cost += Number(item.costPrice || 0) * item.quantity;
        }
      }
      const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

      const rows: (string | number)[][] = [];
      let totRev = 0, totCost = 0;
      for (const [cat, v] of Object.entries(categoryMap)) {
        const profit = v.revenue - v.cost;
        const margin = v.revenue > 0 ? ((profit / v.revenue) * 100).toFixed(1) + "%" : "0%";
        rows.push([cat, formatCurrency(v.revenue), formatCurrency(v.cost), formatCurrency(0), formatCurrency(profit), margin]);
        totRev += v.revenue;
        totCost += v.cost;
      }
      rows.push(["TOTAL", formatCurrency(totRev), formatCurrency(totCost), formatCurrency(totalExpenses), formatCurrency(totRev - totCost - totalExpenses), totRev > 0 ? (((totRev - totCost - totalExpenses) / totRev) * 100).toFixed(1) + "%" : "0%"]);

      return {
        columns: ["Category", "Revenue", "Cost", "Expenses", "Profit", "Margin"],
        data: rows,
      };
    },
  },
  {
    id: "customers",
    name: "Customer Report",
    description: "Customer purchase history and totals",
    icon: FileText,
    color: "amber",
    fetcher: async () => {
      const res = await fetch("/api/customers");
      const customers = await res.json();
      return {
        columns: ["Customer", "Phone", "Email", "Total Orders", "Outstanding", "Status"],
        data: customers.map((c: any) => [
          c.name,
          c.phone || "-",
          c.email || "-",
          String(c._count?.sales || 0),
          formatCurrency(Number(c.outstandingBalance || 0)),
          Number(c.outstandingBalance) > 0 ? "Outstanding" : "Active",
        ]),
      };
    },
  },
  {
    id: "expenses",
    name: "Expense Report",
    description: "Detailed expense breakdown",
    icon: FileText,
    color: "red",
    fetcher: async () => {
      const res = await fetch("/api/expenses");
      const expenses = await res.json();
      return {
        columns: ["Category", "Amount", "Date", "Description", "Payment Method"],
        data: expenses.map((e: any) => [
          e.category,
          formatCurrency(Number(e.amount)),
          formatDate(e.createdAt),
          e.description || "-",
          e.paymentMethod || "-",
        ]),
      };
    },
  },
  {
    id: "stock-movement",
    name: "Stock Movement Report",
    description: "All inventory in/out movements",
    icon: FileText,
    color: "indigo",
    fetcher: async () => {
      const res = await fetch("/api/stock");
      const movements = await res.json();
      return {
        columns: ["Date", "Product", "Type", "Quantity", "Reference", "Notes"],
        data: movements.map((m: any) => [
          formatDate(m.createdAt),
          m.product?.name || "-",
          m.type,
          String(m.quantity),
          m.reference || "-",
          m.notes || "-",
        ]),
      };
    },
  },
];

function buildPdf(name: string, columns: string[], data: (string | number)[][], period: string) {
  const jsPDF = require("jspdf").default;
  const autoTable = require("jspdf-autotable").default;

  const doc = new jsPDF("l", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FirstLady POS", 15, 15);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(name, 15, 23);
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}  |  Period: ${period}`,
    15,
    30
  );

  autoTable(doc, {
    startY: 42,
    head: [columns],
    body: data,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}  |  FirstLady POS & Stock Management  |  Confidential`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`${name.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`);
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set());

  const handleGenerate = async (report: ReportDef) => {
    setGeneratingId(report.id);
    try {
      const { columns, data } = await report.fetcher(period);
      buildPdf(report.name, columns, data, period);
      setGeneratedIds((prev) => new Set(prev).add(report.id));
    } catch (e) {
      console.error("Failed to generate report", e);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Generate and download business reports</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          const isGenerating = generatingId === report.id;
          const isGenerated = generatedIds.has(report.id);

          return (
            <motion.div variants={item} key={report.id}>
              <Card hover className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-${report.color}-50 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${report.color}-600`} />
                    </div>
                    <Badge variant="outline">PDF</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{report.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                  <div className="flex items-center justify-end">
                    <Button
                      variant={isGenerated ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGenerate(report)}
                      disabled={isGenerating}
                      className={isGenerated ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}
                    >
                      {isGenerating ? (
                        <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Generating...</>
                      ) : isGenerated ? (
                        <><CheckCircle2 className="w-4 h-4 mr-1" />Download</>
                      ) : (
                        <><Download className="w-4 h-4 mr-1" />Generate</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
