"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Receipt, Loader2, CheckCircle2, XCircle, Clock, Trash2, Check, Ban } from "lucide-react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const EXPENSE_CATEGORIES = ["Rent", "Utilities", "Salaries", "Marketing", "Transport", "Office Supplies", "Maintenance", "Insurance", "Taxes", "Other"];

export default function ExpensesPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amount: "", category: "Other", date: new Date().toISOString().split("T")[0] });

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try { const res = await fetch("/api/expenses?limit=200"); const json = await res.json(); setExpenses(json.data || json); } catch { console.error("Failed to fetch expenses"); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to create expense");
        return;
      }
      setShowDialog(false); setForm({ title: "", description: "", amount: "", category: "Other", date: new Date().toISOString().split("T")[0] }); fetchExpenses();
    } catch {
      alert("Network error. Please try again.");
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    if (!confirm(`${status === "APPROVED" ? "Approve" : "Reject"} this expense?`)) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update expense");
        return;
      }
      fetchExpenses();
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete expense");
        return;
      }
      fetchExpenses();
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const filtered = expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const statusIcons: Record<string, any> = { APPROVED: CheckCircle2, PENDING: Clock, REJECTED: XCircle };
  const statusColors: Record<string, string> = { APPROVED: "success", PENDING: "warning", REJECTED: "destructive" };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Expenses</h1><p className="text-gray-500 mt-1">Track and manage business expenses</p></div>
        <Button onClick={() => setShowDialog(true)}><Plus className="w-4 h-4 mr-2" /> Add Expense</Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total Expenses</p><p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Approved</p><p className="text-2xl font-bold text-emerald-600 mt-1">{expenses.filter(e => e.status === "APPROVED").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-amber-600 mt-1">{expenses.filter(e => e.status === "PENDING").length}</p></CardContent></Card>
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader><Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} /></CardHeader>
          <CardContent>
            {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((e) => {
                    const Icon = statusIcons[e.status] || Clock;
                    return (
                      <TableRow key={e.id}>
                        <TableCell><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white"><Receipt className="w-5 h-5" /></div><div><p className="font-medium text-gray-900">{e.title}</p>{e.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{e.description}</p>}</div></div></TableCell>
                        <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                        <TableCell className="font-semibold text-red-600">{formatCurrency(Number(e.amount))}</TableCell>
                        <TableCell><Badge variant={statusColors[e.status] as any} className="flex items-center gap-1 w-fit"><Icon className="w-3 h-3" />{e.status}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDate(e.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {isAdmin && e.status === "PENDING" && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700" onClick={() => handleStatusChange(e.id, "APPROVED")} title="Approve">
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleStatusChange(e.id, "REJECTED")} title="Reject">
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {isAdmin && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(e.id)} title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input label="Amount (₦)" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Category</label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Add Expense</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
