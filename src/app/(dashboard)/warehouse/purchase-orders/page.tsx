"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Package, Truck, Loader2, Eye, CheckCircle,
  XCircle, Trash2, CreditCard, Clock, ThumbsUp, DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

interface PoItem {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  total: number;
  product?: { id: string; name: string; sku: string };
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  totalAmount: number;
  status: string;
  expectedDate: string | null;
  notes: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  paidById: string | null;
  paidAt: string | null;
  receivedById: string | null;
  receivedAt: string | null;
  createdAt: string;
  supplier: { id: string; name: string };
  items: PoItem[];
}

interface Product { id: string; name: string; sku: string; costPrice: number; stockQuantity: number; }
interface Supplier { id: string; name: string; }

export default function PurchaseOrdersPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role || "ADMIN";

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<PurchaseOrder | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({ supplierId: "", expectedDate: "", notes: "" });
  const [formItems, setFormItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([
    { productId: "", quantity: 1, unitCost: 0 },
  ]);

  const canCreate = role === "ADMIN" || role === "WAREHOUSE";
  const canApprove = role === "ADMIN" || role === "ACCOUNTANT";
  const canReceive = role === "ADMIN" || role === "WAREHOUSE";

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/purchase-orders?${params}`);
      const json = await res.json();
      setOrders(json.data || json);
    } catch { console.error("Failed to fetch purchase orders"); } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    Promise.all([
      fetch("/api/products?limit=200").then((r) => r.json()),
      fetch("/api/suppliers?limit=200").then((r) => r.json()),
    ]).then(([p, s]) => { setProducts(p.data || p); setSuppliers(s.data || s); });
  }, []);

  const filtered = orders.filter(
    (o) => o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const items = formItems.filter((fi) => fi.productId && fi.quantity > 0 && fi.unitCost > 0)
        .map((fi) => ({ productId: fi.productId, quantity: fi.quantity, unitCost: fi.unitCost }));
      if (!form.supplierId || items.length === 0) { alert("Please select a supplier and add at least one valid item."); return; }
      const res = await fetch("/api/purchase-orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });
      if (!res.ok) { const data = await res.json(); alert(data.error || "Failed to create purchase order"); return; }
      setShowCreate(false);
      setForm({ supplierId: "", expectedDate: "", notes: "" });
      setFormItems([{ productId: "", quantity: 1, unitCost: 0 }]);
      fetchOrders();
    } catch { alert("Network error. Please try again."); } finally { setSaving(false); }
  };

  const handleAction = async (orderId: string, action: string, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setActionLoading(orderId + action);
    try {
      const url = action === "receive" ? `/api/purchase-orders/${orderId}/receive`
        : action === "approve" ? `/api/purchase-orders/${orderId}/approve`
        : action === "pay" ? `/api/purchase-orders/${orderId}/pay`
        : `/api/purchase-orders/${orderId}`;
      const method = action === "delete" ? "DELETE" : "POST";
      const body = action === "cancel" ? JSON.stringify({ status: "CANCELLED" }) : undefined;
      const headers = action === "cancel" ? { "Content-Type": "application/json" } : undefined;
      const res = await fetch(url, { method, headers, body });
      if (!res.ok) { const data = await res.json(); alert(data.error || `Failed to ${action} order`); return; }
      fetchOrders(); setShowDetail(null);
    } catch { alert("Network error. Please try again."); } finally { setActionLoading(null); }
  };

  const addItem = () => setFormItems([...formItems, { productId: "", quantity: 1, unitCost: 0 }]);
  const removeItem = (idx: number) => setFormItems(formItems.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...formItems];
    (updated[idx] as any)[field] = field === "productId" ? value : Number(value);
    if (field === "productId") { const product = products.find((p) => p.id === value); if (product) updated[idx].unitCost = Number(product.costPrice); }
    setFormItems(updated);
  };
  const orderTotal = formItems.reduce((sum, fi) => sum + fi.quantity * fi.unitCost, 0);

  const getActions = (order: PurchaseOrder) => {
    const actions: { label: string; icon: any; color: string; action: string; confirm: string }[] = [];
    if (order.status === "PENDING" && canApprove) {
      actions.push({ label: "Approve", icon: ThumbsUp, color: "text-blue-500", action: "approve", confirm: "Approve this purchase order?" });
      actions.push({ label: "Cancel", icon: XCircle, color: "text-red-500", action: "cancel", confirm: "Cancel this purchase order?" });
    }
    if (order.status === "APPROVED" && canApprove) {
      actions.push({ label: "Mark Paid", icon: DollarSign, color: "text-purple-500", action: "pay", confirm: "Mark this order as paid? Account will release funds." });
      actions.push({ label: "Cancel", icon: XCircle, color: "text-red-500", action: "cancel", confirm: "Cancel this purchase order?" });
    }
    if (order.status === "PAID" && canReceive) {
      actions.push({ label: "Receive", icon: CheckCircle, color: "text-emerald-500", action: "receive", confirm: "Receive this order? Stock will be updated." });
    }
    if (order.status !== "COMPLETED" && role === "ADMIN") {
      actions.push({ label: "Delete", icon: Trash2, color: "text-red-500", action: "delete", confirm: "Permanently delete this purchase order?" });
    }
    return actions;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 mt-1">Manage supplier purchase orders and receiving</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setForm({ supplierId: "", expectedDate: "", notes: "" }); setFormItems([{ productId: "", quantity: 1, unitCost: 0 }]); setShowCreate(true); }}>
            <Plus className="w-4 h-4 mr-2" /> New Order
          </Button>
        )}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: Package, color: "text-blue-600" },
          { label: "Pending Approval", value: orders.filter((o) => o.status === "PENDING").length, icon: Clock, color: "text-amber-600" },
          { label: "Approved", value: orders.filter((o) => o.status === "APPROVED").length, icon: ThumbsUp, color: "text-blue-600" },
          { label: "Completed", value: orders.filter((o) => o.status === "COMPLETED").length, icon: CheckCircle, color: "text-emerald-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
                <div><p className="text-xs text-gray-500">{stat.label}</p><p className="text-lg font-bold text-gray-900">{stat.value}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => {
                    const actions = getActions(order);
                    return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white"><Package className="w-5 h-5" /></div>
                          <div><p className="font-medium text-gray-900">{order.orderNumber}</p><p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p></div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{order.supplier.name}</TableCell>
                      <TableCell className="text-sm">{order.items.length} line(s)</TableCell>
                      <TableCell className="text-sm font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell className="text-sm text-gray-500">{order.expectedDate ? formatDate(order.expectedDate) : "N/A"}</TableCell>
                      <TableCell><Badge className={STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}>{order.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setShowDetail(order)}><Eye className="w-4 h-4" /></Button>
                          {actions.map((a) => (
                            <Button key={a.action} variant="ghost" size="icon" onClick={() => handleAction(order.id, a.action, a.confirm)} disabled={actionLoading === order.id + a.action}>
                              {actionLoading === order.id + a.action ? <Loader2 className="w-4 h-4 animate-spin" /> : <a.icon className={`w-4 h-4 ${a.color}`} />}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No purchase orders found</TableCell></TableRow>}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Order Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Supplier *</label>
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" required>
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Expected Date</label>
                <Input type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
              <Input placeholder="Optional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Items *</label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add Item</Button>
              </div>
              {formItems.map((fi, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <select value={fi.productId} onChange={(e) => updateItem(idx, "productId", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" required>
                      <option value="">Select product</option>
                      {products.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.sku})</option>))}
                    </select>
                  </div>
                  <div className="col-span-2"><Input type="number" min="1" value={fi.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} placeholder="Qty" /></div>
                  <div className="col-span-3"><Input type="number" min="0" step="0.01" value={fi.unitCost} onChange={(e) => updateItem(idx, "unitCost", e.target.value)} placeholder="Unit cost" /></div>
                  <div className="col-span-2 flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-700">{formatCurrency(fi.quantity * fi.unitCost)}</span>
                    {formItems.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}><XCircle className="w-4 h-4 text-red-400" /></Button>}
                  </div>
                </div>
              ))}
              <div className="text-right text-sm font-bold text-gray-900 pt-2 border-t">Total: {formatCurrency(orderTotal)}</div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {showDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{showDetail.orderNumber}</DialogTitle>
                  <Badge className={STATUS_COLORS[showDetail.status]}>{showDetail.status}</Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Supplier</p><p className="font-medium">{showDetail.supplier.name}</p></div>
                  <div><p className="text-gray-500">Created</p><p className="font-medium">{formatDate(showDetail.createdAt)}</p></div>
                  <div><p className="text-gray-500">Expected Date</p><p className="font-medium">{showDetail.expectedDate ? formatDate(showDetail.expectedDate) : "N/A"}</p></div>
                  <div><p className="text-gray-500">Total</p><p className="font-bold">{formatCurrency(showDetail.totalAmount)}</p></div>
                  {showDetail.approvedAt && <div><p className="text-gray-500">Approved</p><p className="font-medium">{formatDate(showDetail.approvedAt)}</p></div>}
                  {showDetail.paidAt && <div><p className="text-gray-500">Paid</p><p className="font-medium">{formatDate(showDetail.paidAt)}</p></div>}
                  {showDetail.receivedAt && <div><p className="text-gray-500">Received</p><p className="font-medium">{formatDate(showDetail.receivedAt)}</p></div>}
                </div>
                {showDetail.notes && <div><p className="text-sm text-gray-500">Notes</p><p className="text-sm">{showDetail.notes}</p></div>}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Unit Cost</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {showDetail.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">{item.product?.name || "—"}</TableCell>
                          <TableCell className="text-sm">{item.quantity}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(item.unitCost)}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>

                {(() => {
                  const actions = getActions(showDetail);
                  if (actions.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {actions.map((a) => (
                        <Button key={a.action} onClick={() => handleAction(showDetail.id, a.action, a.confirm)} disabled={actionLoading === showDetail.id + a.action}
                          variant={a.action === "cancel" || a.action === "delete" ? "outline" : "default"}
                          className={a.action === "receive" ? "bg-emerald-600 hover:bg-emerald-700" : a.action === "approve" ? "bg-blue-600 hover:bg-blue-700" : a.action === "pay" ? "bg-purple-600 hover:bg-purple-700" : ""}
                        >
                          {actionLoading === showDetail.id + a.action ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <a.icon className="w-4 h-4 mr-2" />}
                          {a.label}
                        </Button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
