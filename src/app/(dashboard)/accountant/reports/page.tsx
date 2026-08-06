"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const reports = [
  {
    id: 1,
    name: "Daily Sales Report",
    description: "Complete breakdown of daily sales transactions",
    icon: BarChart3,
    lastGenerated: "2024-01-15",
    color: "blue",
    columns: ["Date", "Customer", "Product", "Quantity", "Amount", "Status"],
    data: [
      ["2024-01-15", "Mama Ngozi Store", "First Lady Red Palm Olein (5L)", "20", "₦130,000", "Completed"],
      ["2024-01-15", "Kemi Supermarket", "First Lady Red Palm Olein (5L)", "10", "₦65,000", "Completed"],
      ["2024-01-15", "Ibrahim General Store", "Purewave Soap (Family Pack)", "30", "₦36,000", "Completed"],
      ["2024-01-14", "Funke Provisions", "Purewave Cream (Large)", "15", "₦33,000", "Completed"],
      ["2024-01-14", "Emeka Mini Market", "First Lady Red Palm Olein (3L)", "25", "₦100,000", "Completed"],
    ],
  },
  {
    id: 2,
    name: "Inventory Status Report",
    description: "Current stock levels and valuation",
    icon: PieChart,
    lastGenerated: "2024-01-14",
    color: "emerald",
    columns: ["Product", "SKU", "Current Stock", "Min Level", "Unit Price", "Total Value", "Status"],
    data: [
      ["First Lady Red Palm Olein (5L)", "FLO-00001", "450", "50", "₦13,000", "₦5,850,000", "Good"],
      ["First Lady Red Palm Olein (3L)", "FLO-00002", "150", "40", "₦8,000", "₦1,200,000", "Low"],
      ["First Lady Red Palm Olein (1L)", "FLO-00003", "600", "60", "₦3,500", "₦2,100,000", "Good"],
      ["Purewave Soap (Family Pack)", "PWV-00001", "320", "40", "₦1,200", "₦384,000", "Good"],
      ["Purewave Soap (Regular)", "PWV-00002", "250", "60", "₦600", "₦150,000", "Low"],
      ["Purewave Cream (Large)", "PWC-00001", "120", "30", "₦2,500", "₦300,000", "Low"],
      ["Purewave Cream (Medium)", "PWC-00002", "200", "30", "₦1,800", "₦360,000", "Good"],
      ["Purewave Cream (Small)", "PWC-00003", "280", "40", "₦1,000", "₦280,000", "Good"],
    ],
  },
  {
    id: 3,
    name: "Profit & Loss Report",
    description: "Monthly revenue, costs, and profit analysis",
    icon: TrendingUp,
    lastGenerated: "2024-01-13",
    color: "purple",
    columns: ["Category", "Revenue", "Cost", "Expenses", "Profit", "Margin"],
    data: [
      ["Food & Cooking Oils", "₦1,800,000", "₦1,260,000", "₦180,000", "₦360,000", "20%"],
      ["Toiletries & Personal Care", "₦1,200,000", "₦720,000", "₦120,000", "₦360,000", "30%"],
      ["TOTAL", "₦3,000,000", "₦1,980,000", "₦300,000", "₦720,000", "24%"],
    ],
  },
  {
    id: 4,
    name: "Customer Report",
    description: "Customer purchase history and outstanding balances",
    icon: FileText,
    lastGenerated: "2024-01-12",
    color: "amber",
    columns: ["Customer", "Total Orders", "Total Spent", "Last Order", "Outstanding", "Status"],
    data: [
      ["Mama Ngozi Store", "45", "₦5,850,000", "2024-01-15", "₦0", "Active"],
      ["Kemi Supermarket", "32", "₦2,080,000", "2024-01-15", "₦50,000", "Active"],
      ["Ibrahim General Store", "28", "₦1,008,000", "2024-01-15", "₦0", "Active"],
      ["Funke Provisions", "22", "₦726,000", "2024-01-14", "₦15,000", "Active"],
      ["Emeka Mini Market", "18", "₦1,800,000", "2024-01-14", "₦0", "Active"],
    ],
  },
  {
    id: 5,
    name: "Expense Report",
    description: "Detailed expense breakdown by category",
    icon: FileText,
    lastGenerated: "2024-01-11",
    color: "red",
    columns: ["Category", "Amount", "Date", "Description", "Approved By"],
    data: [
      ["Rent & Utilities", "₦250,000", "2024-01-01", "Monthly warehouse rent", "Admin"],
      ["Transportation", "₦85,000", "2024-01-05", "Delivery logistics", "Warehouse"],
      ["Staff Salaries", "₦450,000", "2024-01-01", "Monthly payroll", "Admin"],
      ["Packaging", "₦35,000", "2024-01-10", "Cartons and wrapping materials", "Warehouse"],
      ["Maintenance", "₦25,000", "2024-01-12", "Equipment repair", "Admin"],
    ],
  },
  {
    id: 6,
    name: "Stock Movement Report",
    description: "All inventory in/out movements",
    icon: FileText,
    lastGenerated: "2024-01-10",
    color: "indigo",
    columns: ["Date", "Product", "Type", "Quantity", "Reference", "Balance"],
    data: [
      ["2024-01-15", "First Lady Red Palm Olein (5L)", "OUT", "50", "SALE-001", "450"],
      ["2024-01-15", "Purewave Soap (Regular)", "OUT", "30", "SALE-002", "250"],
      ["2024-01-14", "First Lady Red Palm Olein (5L)", "IN", "200", "PO-001", "500"],
      ["2024-01-13", "Purewave Cream (Large)", "OUT", "15", "SALE-003", "120"],
      ["2024-01-12", "Purewave Soap (Family Pack)", "IN", "100", "PO-002", "320"],
    ],
  },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [generatedIds, setGeneratedIds] = useState<Set<number>>(new Set());

  const handleGenerate = async (report: typeof reports[0]) => {
    setGeneratingId(report.id);

    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Dynamically import jsPDF
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FirstLady POS", 15, 15);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(report.name, 15, 23);

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}  |  Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, 15, 30);

    // Table
    autoTable(doc, {
      startY: 42,
      head: [report.columns],
      body: report.data,
      theme: "grid",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 15, right: 15 },
    });

    // Footer
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

    doc.save(`${report.name.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`);

    setGeneratingId(null);
    setGeneratedIds((prev) => new Set(prev).add(report.id));
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Generate and download business reports</p>
        </div>
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
        {reports.map((report) => {
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Last: {report.lastGenerated}</span>
                    <Button
                      variant={isGenerated ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGenerate(report)}
                      disabled={isGenerating}
                      className={isGenerated ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : isGenerated ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Download
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-1" />
                          Generate
                        </>
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
