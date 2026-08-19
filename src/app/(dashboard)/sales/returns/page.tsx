"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Search, Plus, Loader2, Package, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const statusColors: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", APPROVED: "bg-emerald-100 text-emerald-700", REJECTED: "bg-red-100 text-red-700", COMPLETED: "bg-blue-100 text-blue-700" };

export default function ReturnsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role || "SALES";
  const canApprove = role === "ADMIN" || role === "ACCOUNTANT";

  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [returnItems, setReturnItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);

  useEffect(() => { fetchReturns(); fetchSales(); }, []);

  const fetchReturns = async () => {
    try { const res = await fetch("/api/returns?limit=200"); const json = await res.json(); setReturns(json.data || json); } catch { console.error("Failed to fetch returns"); } finally { setLoading(false); }
  };

  const fetchSales = async () => {
    try { const res = await fetch("/api/sales?limit=200"); const json = await res.json(); setSales(json.data || json); } catch {}
  };

  const handleStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED") => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this return?`)) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/returns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update return");
        return;
      }
      fetchReturns();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaleSelect = (saleId: string) => {
    const sale = sales.find((s: any) => s.id === saleId);
    setSelectedSale(sale);
    setReturnItems(sale ? sale.items.map((i: any) => ({ productId: i.productId, quantity: 0, unitPrice: Number(i.unitPrice) })) : []);
  };

  const updateReturnItem = (idx: number, field: string, value: any) => {
    setReturnItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = returnItems.filter(i => i.quantity > 0);
    if (!selectedSale || !reason || validItems.length === 0) { alert("Select a sale, enter reason, and set quantity for at least one item."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId: selectedSale.id, reason, items: validItems }),
      });
      if (!res.ok) { const data = await res.json(); alert(data.error || "Failed to create return"); return; }
      setShowDialog(false); setSelectedSale(null); setReason(""); setReturnItems([]);
      fetchReturns();
    } catch { alert("Network error. Please try again."); } finally { setSaving(false); }
  };

  const filtered = returns.filter((r: any) =>
    r.returnNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.sale?.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
          <p className="text-gray-500 mt-1">Manage product returns and refunds</p>
        </div>
        <Button onClick={() => { setSelectedSale(null); setReason(""); setReturnItems([]); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Return
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <Input placeholder="Search returns..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Return #</TableHead>
                      <TableHead>Sale</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      {canApprove && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.returnNumber}</TableCell>
                        <TableCell className="text-sm">{r.sale?.invoiceNumber || "—"}</TableCell>
                        <TableCell className="text-sm">{r.items?.length || 0} item(s)</TableCell>
                        <TableCell className="font-semibold text-red-600">{formatCurrency(Number(r.totalAmount))}</TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{r.reason}</TableCell>
                        <TableCell><Badge className={statusColors[r.status] || ""}>{r.status}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDate(r.createdAt)}</TableCell>
                        {canApprove && (
                          <TableCell>
                            {r.status === "PENDING" ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="h-7 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleStatusUpdate(r.id, "APPROVED")} disabled={updatingId === r.id}>
                                  {updatingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusUpdate(r.id, "REJECTED")} disabled={updatingId === r.id}>
                                  {updatingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No returns found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Return</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Select Sale</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={selectedSale?.id || ""} onChange={(e) => handleSaleSelect(e.target.value)} required>
                <option value="">Choose a sale...</option>
                {sales.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.invoiceNumber} - {s.customer?.name || "Walk-in"} ({s.items?.length} items)</option>
                ))}
              </select>
            </div>

            {selectedSale && (
              <div className="border rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Return Items</p>
                {selectedSale.items.map((si: any, idx: number) => {
                  const ri = returnItems.find(r => r.productId === si.productId);
                  return (
                    <div key={si.id} className="flex items-center gap-3">
                      <span className="flex-1 text-sm">{si.product?.name || si.productId}</span>
                      <span className="text-xs text-gray-400">Sold: {si.quantity}</span>
                      <input type="number" min="0" max={si.quantity} placeholder="0" className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" value={ri?.quantity || ""} onChange={(e) => updateReturnItem(idx, "quantity", parseInt(e.target.value) || 0)} />
                    </div>
                  );
                })}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Reason</label>
              <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" rows={3} placeholder="Reason for return..." value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />} Process Return</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
