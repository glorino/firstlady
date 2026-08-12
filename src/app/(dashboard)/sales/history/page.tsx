"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatCurrencyN, formatDateTime, formatDate } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function exportCsv(sales: any[]) {
  const headers = ["Invoice", "Customer", "Items", "Total", "Payment", "Status", "Date"];
  const rows = sales.map((s) => [
    s.invoiceNumber,
    s.customer?.name || "Walk-in",
    String(s.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0),
    String(Number(s.totalAmount)),
    s.paymentMethod,
    s.status,
    formatDate(s.createdAt),
  ]);
  const quote = (v: string) => '"' + v.replace(/"/g, '""') + '"';
  const csvLines = [headers.join(",")];
  for (const row of rows) {
    csvLines.push(row.map(quote).join(","));
  }
  const csv = csvLines.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sales-history-" + new Date().toISOString().split("T")[0] + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportPdf(sales: any[]) {
  const jsPDF = require("jspdf").default;
  const autoTable = require("jspdf-autotable").default;

  const doc = new jsPDF("l", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("FirstLady POS", 15, 13);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Sales History Report", 15, 21);
  doc.setFontSize(9);
  doc.text("Generated: " + new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }), 15, 27);

  const rows = sales.map((s) => [
    s.invoiceNumber,
    s.customer?.name || "Walk-in",
    String(s.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0),
    formatCurrencyN(Number(s.totalAmount)),
    s.paymentMethod,
    s.status,
    formatDateTime(s.createdAt),
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["Invoice", "Customer", "Qty", "Total", "Payment", "Status", "Date"]],
    body: rows,
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
      "Page " + i + " of " + pageCount + "  |  FirstLady POS & Stock Management",
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save("sales-history-" + new Date().toISOString().split("T")[0] + ".pdf");
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch("/api/sales?limit=200");
      const json = await res.json();
      setSales(json.data || json);
    } catch (error) {
      console.error("Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = useMemo(() =>
    sales.filter(
      (s) =>
        s.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.customer?.name?.toLowerCase().includes(search.toLowerCase())
    ),
    [sales, search]
  );

  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalProfit = filteredSales.reduce((sum, s) => {
    const cogs = s.items?.reduce((c: number, i: any) => c + Number(i.costPrice || 0) * i.quantity, 0) || 0;
    return sum + (Number(s.totalAmount) - cogs);
  }, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
          <p className="text-gray-500 mt-1">View all transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCsv(filteredSales)}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportPdf(filteredSales)}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Filtered Sales</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{filteredSales.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Filtered Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Filtered Profit</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalProfit)}</p>
          </CardContent>
        </Card>
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by invoice or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                        No sales found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-sm font-semibold">{sale.invoiceNumber}</TableCell>
                        <TableCell>{sale.customer?.name || "Walk-in"}</TableCell>
                        <TableCell>{sale.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(Number(sale.totalAmount))}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sale.status === "COMPLETED" ? "success" : sale.status === "CANCELLED" ? "destructive" : "warning"}>
                            {sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDateTime(sale.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
