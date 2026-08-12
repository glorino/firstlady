"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Search, Loader2, Lock, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CashRegisterPage() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [openRegister, setOpenRegister] = useState<any>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");

  useEffect(() => { fetchRegisters(); }, []);

  const fetchRegisters = async () => {
    try {
      const res = await fetch("/api/cash-register?limit=50");
      const json = await res.json();
      const data = json.data || json;
      setRegisters(data);
      setOpenRegister(data.find((r: any) => r.status === "OPEN") || null);
    } catch { console.error("Failed to fetch registers"); } finally { setLoading(false); }
  };

  const handleOpen = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/cash-register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "open", openingBalance: parseFloat(openingBalance) || 0 }) });
      if (!res.ok) { const data = await res.json(); alert(data.error || "Failed to open register"); return; }
      setOpeningBalance("");
      fetchRegisters();
    } catch { alert("Network error. Please try again."); } finally { setProcessing(false); }
  };

  const handleClose = async () => {
    if (!confirm("Close register? This will finalize all sales for this session.")) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/cash-register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "close", closingBalance: parseFloat(closingBalance) || 0 }) });
      if (!res.ok) { const data = await res.json(); alert(data.error || "Failed to close register"); return; }
      setClosingBalance("");
      fetchRegisters();
    } catch { alert("Network error. Please try again."); } finally { setProcessing(false); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-gray-900">Cash Register</h1>
        <p className="text-gray-500 mt-1">Manage your cash register sessions</p>
      </motion.div>

      {/* Open/Close Register */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="p-6">
            {openRegister ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Unlock className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-900">Register Open</h3>
                    <Badge className="bg-emerald-100 text-emerald-700">OPEN</Badge>
                  </div>
                  <p className="text-sm text-gray-500">Opened: {formatDateTime(openRegister.openedAt)}</p>
                  <p className="text-sm text-gray-500">Opening Balance: {formatCurrency(Number(openRegister.openingBalance))}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" step="0.01" placeholder="Closing balance" className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-40" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} />
                  <Button onClick={handleClose} disabled={processing} variant="destructive">
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />} Close Register
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">No Open Register</h3>
                  </div>
                  <p className="text-sm text-gray-500">Open a register to start recording sales</p>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" step="0.01" placeholder="Opening balance" className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-40" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
                  <Button onClick={handleOpen} disabled={processing}>
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />} Open Register
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Session History */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle>Session History</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Opening</TableHead><TableHead>Closing</TableHead><TableHead>Sales</TableHead><TableHead>Returns</TableHead><TableHead>Expenses</TableHead><TableHead>Status</TableHead><TableHead>Opened</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {registers.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.user?.name || "—"}</TableCell>
                        <TableCell>{formatCurrency(Number(r.openingBalance))}</TableCell>
                        <TableCell>{r.closingBalance ? formatCurrency(Number(r.closingBalance)) : "—"}</TableCell>
                        <TableCell className="text-emerald-600 font-semibold">{formatCurrency(Number(r.totalSales))}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(Number(r.totalReturns))}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(Number(r.totalExpenses))}</TableCell>
                        <TableCell><Badge variant={r.status === "OPEN" ? "success" : "secondary"}>{r.status}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDateTime(r.openedAt)}</TableCell>
                      </TableRow>
                    ))}
                    {registers.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">No sessions yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
