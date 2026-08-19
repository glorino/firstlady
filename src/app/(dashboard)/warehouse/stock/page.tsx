"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, Plus, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showWarehouseDialog, setShowWarehouseDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productId: "", type: "PURCHASE", quantity: "", notes: "" });
  const [warehouseForm, setWarehouseForm] = useState({ name: "", address: "", phone: "" });
  const [transferForm, setTransferForm] = useState({ productId: "", fromWarehouseId: "", toWarehouseId: "", quantity: "", notes: "" });

  useEffect(() => { fetchMovements(); fetchProducts(); fetchWarehouses(); }, []);

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

  const fetchWarehouses = async () => {
    try {
      const res = await fetch("/api/warehouses?limit=200");
      const json = await res.json();
      setWarehouses(json.data || json);
    } catch (error) {
      console.error("Failed to fetch warehouses");
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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(transferForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid positive quantity.");
      return;
    }
    if (!transferForm.fromWarehouseId || !transferForm.toWarehouseId) {
      alert("Please select both source and destination warehouses.");
      return;
    }
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      alert("Source and destination warehouses must be different.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: transferForm.productId,
          type: "TRANSFER",
          quantity: qty,
          notes: transferForm.notes || `Transfer from ${warehouses.find(w => w.id === transferForm.fromWarehouseId)?.name} to ${warehouses.find(w => w.id === transferForm.toWarehouseId)?.name}`,
          fromWarehouseId: transferForm.fromWarehouseId,
          toWarehouseId: transferForm.toWarehouseId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to transfer stock");
        return;
      }
      setShowTransferDialog(false); setTransferForm({ productId: "", fromWarehouseId: "", toWarehouseId: "", quantity: "", notes: "" });
      fetchMovements(); fetchProducts();
    } catch {
      alert("Network error. Please try again.");
    } finally { setSaving(false); }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(warehouseForm),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to create warehouse");
        return;
      }
      setShowWarehouseDialog(false);
      setWarehouseForm({ name: "", address: "", phone: "" });
      fetchWarehouses();
    } catch { alert("Network error. Please try again."); } finally { setSaving(false); }
  };

  const filtered = movements.filter(m => m.product?.name?.toLowerCase().includes(search.toLowerCase()));

  const typeColors: Record<string, string> = {
    PURCHASE: "success", SALE: "destructive", ADJUSTMENT: "warning", RETURN: "default", TRANSFER: "secondary",
  };

  const typeIcons: Record<string, any> = {
    PURCHASE: ArrowDownRight, SALE: ArrowUpRight, ADJUSTMENT: RefreshCw, RETURN: ArrowDownRight, TRANSFER: ArrowRightLeft,
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1><p className="text-gray-500 mt-1">Track all inventory changes</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowWarehouseDialog(true)}>Manage Warehouses</Button>
          <Button variant="outline" onClick={() => setShowTransferDialog(true)}><ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer</Button>
          <Button onClick={() => setShowDialog(true)}><Plus className="w-4 h-4 mr-2" /> Record Movement</Button>
        </div>
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
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Product</TableHead><TableHead>Quantity</TableHead><TableHead>Warehouse</TableHead><TableHead>Reference</TableHead><TableHead>Notes</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((m) => {
                    const Icon = typeIcons[m.type] || RefreshCw;
                    return (
                      <TableRow key={m.id}>
                        <TableCell><Badge variant={typeColors[m.type] as any} className="flex items-center gap-1 w-fit"><Icon className="w-3 h-3" />{m.type}</Badge></TableCell>
                        <TableCell className="font-medium">{m.product?.name || "N/A"}</TableCell>
                        <TableCell className={cn("font-semibold", m.type === "SALE" || m.type === "TRANSFER" ? "text-red-500" : "text-emerald-500")}>{m.type === "SALE" || m.type === "TRANSFER" ? "-" : "+"}{m.quantity}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {m.type === "TRANSFER" && m.fromWarehouse && m.toWarehouse
                            ? `${m.fromWarehouse.name} → ${m.toWarehouse.name}`
                            : m.toWarehouse?.name || m.fromWarehouse?.name || "—"}
                        </TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Stock Movement</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Product</label><Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger><SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Type</label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PURCHASE">Purchase</SelectItem><SelectItem value="SALE">Sale</SelectItem><SelectItem value="ADJUSTMENT">Adjustment</SelectItem><SelectItem value="RETURN">Return</SelectItem></SelectContent></Select></div>
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Record</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" /> Transfer Stock Between Warehouses</DialogTitle></DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Product</label><Select value={transferForm.productId} onValueChange={(v) => setTransferForm({ ...transferForm, productId: v })}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger><SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">From Warehouse</label><Select value={transferForm.fromWarehouseId} onValueChange={(v) => setTransferForm({ ...transferForm, fromWarehouseId: v })}><SelectTrigger><SelectValue placeholder="Source warehouse" /></SelectTrigger><SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">To Warehouse</label><Select value={transferForm.toWarehouseId} onValueChange={(v) => setTransferForm({ ...transferForm, toWarehouseId: v })}><SelectTrigger><SelectValue placeholder="Destination warehouse" /></SelectTrigger><SelectContent>{warehouses.filter(w => w.id !== transferForm.fromWarehouseId).map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></div>
            <Input label="Quantity" type="number" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} required />
            <Input label="Notes" value={transferForm.notes} onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })} />
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowTransferDialog(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Transfer</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Warehouse Management Dialog */}
      <Dialog open={showWarehouseDialog} onOpenChange={setShowWarehouseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Manage Warehouses</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {warehouses.length > 0 && (
              <div className="space-y-2">
                {warehouses.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{w.name}</p>
                      <p className="text-xs text-gray-500">{w.address || "No address"}</p>
                    </div>
                    <Badge variant={w.isActive ? "success" : "destructive"}>{w.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Add New Warehouse</p>
              <form onSubmit={handleCreateWarehouse} className="space-y-3">
                <Input label="Warehouse Name" value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} required />
                <Input label="Address" value={warehouseForm.address} onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })} />
                <Input label="Phone" value={warehouseForm.phone} onChange={(e) => setWarehouseForm({ ...warehouseForm, phone: e.target.value })} />
                <Button type="submit" disabled={saving} className="w-full">{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Create Warehouse</Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
