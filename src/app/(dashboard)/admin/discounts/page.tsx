"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tag, Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", description: "", type: "PERCENTAGE", value: "", minPurchase: "", maxUses: "", startDate: "", endDate: "" });

  useEffect(() => { fetchDiscounts(); }, []);

  const fetchDiscounts = async () => {
    try { const res = await fetch("/api/discounts?limit=200"); const json = await res.json(); setDiscounts(json.data || json); } catch { console.error("Failed to fetch discounts"); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/discounts/${editing.id}` : "/api/discounts";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, value: parseFloat(form.value) || 0, minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : null, maxUses: form.maxUses ? parseInt(form.maxUses) : null }) });
      if (!res.ok) { const data = await res.json(); alert(data.error || "Failed to save discount"); return; }
      setShowDialog(false); setEditing(null); setForm({ code: "", description: "", type: "PERCENTAGE", value: "", minPurchase: "", maxUses: "", startDate: "", endDate: "" });
      fetchDiscounts();
    } catch { alert("Network error. Please try again."); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this discount?")) return;
    try {
      const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json(); alert(data.error || "Failed to delete discount"); return; }
      fetchDiscounts();
    } catch { alert("Network error. Please try again."); }
  };

  const filtered = discounts.filter((d: any) => d.code?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Discounts</h1><p className="text-gray-500 mt-1">Manage discount codes and promotions</p></div>
        <Button onClick={() => { setEditing(null); setForm({ code: "", description: "", type: "PERCENTAGE", value: "", minPurchase: "", maxUses: "", startDate: "", endDate: "" }); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Discount
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader><Input placeholder="Search discounts..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} /></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>Min Purchase</TableHead><TableHead>Uses</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filtered.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono font-bold">{d.code}</TableCell>
                        <TableCell><Badge variant="outline">{d.type}</Badge></TableCell>
                        <TableCell className="font-semibold">{d.type === "PERCENTAGE" ? `${d.value}%` : formatCurrency(Number(d.value))}</TableCell>
                        <TableCell>{d.minPurchase ? formatCurrency(Number(d.minPurchase)) : "—"}</TableCell>
                        <TableCell>{d.usedCount}{d.maxUses ? `/${d.maxUses}` : ""}</TableCell>
                        <TableCell><Badge variant={d.isActive ? "success" : "destructive"}>{d.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                        <TableCell><div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={() => { setEditing(d); setForm({ code: d.code, description: d.description || "", type: d.type, value: String(d.value), minPurchase: d.minPurchase ? String(d.minPurchase) : "", maxUses: d.maxUses ? String(d.maxUses) : "", startDate: d.startDate ? new Date(d.startDate).toISOString().split("T")[0] : "", endDate: d.endDate ? new Date(d.endDate).toISOString().split("T")[0] : "" }); setShowDialog(true); }}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No discounts found</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Discount" : "Add Discount"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="e.g. SUMMER20" />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-gray-700 block mb-1">Type</label><select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option></select></div>
              <Input label="Value" type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Min Purchase" type="number" step="0.01" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })} />
              <Input label="Max Uses" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} {editing ? "Update" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
