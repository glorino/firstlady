"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime, cn } from "@/lib/utils";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productId: "", type: "PURCHASE", quantity: "", notes: "" });

  useEffect(() => { fetchMovements(); fetchProducts(); }, []);

  const fetchMovements = async () => {
    try {
      const res = await fetch("/api/stock?limit=200");
      const json = await res.json();
      setMovements(json.data || json);
    } catch { console.error("Failed to fetch stock movements"); } finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=200");
      const json = await res.json();
      setProducts(json.data || json);
    } catch (error) {
      console.error("Failed to fetch products");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(form.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid positive quantity.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity: qty }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to record stock movement");
        return;
      }
      setShowDialog(false); setForm({ productId: "", type: "PURCHASE", quantity: "", notes: "" });
      fetchMovements(); fetchProducts();
    } catch {
      alert("Network error. Please try again.");
    } finally { setSaving(false); }
  };

  const filtered = movements.filter(m => m.product?.name?.toLowerCase().includes(search.toLowerCase()));

  const typeColors: Record<string, string> = {
    PURCHASE: "success", SALE: "destructive", ADJUSTMENT: "warning", RETURN: "default", TRANSFER: "secondary",
  };

  const typeIcons: Record<string, any> = {
    PURCHASE: ArrowDownRight, SALE: ArrowUpRight, ADJUSTMENT: RefreshCw, RETURN: ArrowDownRight, TRANSFER: RefreshCw,
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1><p className="text-gray-500 mt-1">Track all inventory changes</p></div>
        <Button onClick={() => setShowDialog(true)}><Plus className="w-4 h-4 mr-2" /> Record Movement</Button>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader><Input placeholder="Search movements..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} /></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Product</TableHead><TableHead>Quantity</TableHead><TableHead>Reference</TableHead><TableHead>Notes</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((m) => {
                    const Icon = typeIcons[m.type] || RefreshCw;
                    return (
                      <TableRow key={m.id}>
                        <TableCell><Badge variant={typeColors[m.type] as any} className="flex items-center gap-1 w-fit"><Icon className="w-3 h-3" />{m.type}</Badge></TableCell>
                        <TableCell className="font-medium">{m.product?.name || "N/A"}</TableCell>
                        <TableCell className={cn("font-semibold", m.type === "SALE" || m.type === "TRANSFER" ? "text-red-500" : "text-emerald-500")}>{m.type === "SALE" || m.type === "TRANSFER" ? "-" : "+"}{m.quantity}</TableCell>
                        <TableCell className="text-sm text-gray-500">{m.reference || "N/A"}</TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{m.notes || "N/A"}</TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDateTime(m.createdAt)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Stock Movement</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Product</label><Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger><SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Type</label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PURCHASE">Purchase</SelectItem><SelectItem value="SALE">Sale</SelectItem><SelectItem value="ADJUSTMENT">Adjustment</SelectItem><SelectItem value="RETURN">Return</SelectItem><SelectItem value="TRANSFER">Transfer</SelectItem></SelectContent></Select></div>
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Record</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
