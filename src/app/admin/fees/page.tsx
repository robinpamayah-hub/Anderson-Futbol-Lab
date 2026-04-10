export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FEE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrencyExact, formatDate } from "@/lib/utils";
import { Plus, DollarSign, CreditCard } from "lucide-react";
import type { Player, Fee, Payment } from "@/lib/types";

export default function FeesPage() {
  const [fees, setFees] = useState<(Fee & { player?: Player })[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

  const [feeForm, setFeeForm] = useState({
    player_id: "", description: "", amount: "", due_date: "", season: "Spring 2026",
    category: "registration" as Fee["category"],
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "", method: "card" as Payment["method"], reference: "", notes: "",
  });

  const supabase = createClient();

  async function loadData() {
    const [{ data: f }, { data: p }] = await Promise.all([
      supabase.from("fees").select("*, player:players(*)").order("due_date", { ascending: false }),
      supabase.from("players").select("*").eq("is_active", true).order("last_name"),
    ]);
    setFees((f || []) as (Fee & { player?: Player })[]);
    setPlayers((p || []) as Player[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleAddFee(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("fees").insert({
      player_id: feeForm.player_id,
      description: feeForm.description,
      amount: parseFloat(feeForm.amount),
      due_date: feeForm.due_date,
      season: feeForm.season,
      category: feeForm.category,
    });
    if (!error) {
      setFeeDialogOpen(false);
      setFeeForm({ player_id: "", description: "", amount: "", due_date: "", season: "Spring 2026", category: "registration" });
      loadData();
    }
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFee) return;
    const paymentAmount = parseFloat(paymentForm.amount);
    const { error } = await supabase.from("payments").insert({
      fee_id: selectedFee.id,
      player_id: selectedFee.player_id,
      amount: paymentAmount,
      method: paymentForm.method,
      reference: paymentForm.reference,
      notes: paymentForm.notes,
    });
    if (!error) {
      // Update fee status
      const newStatus = paymentAmount >= Number(selectedFee.amount) ? "paid" : "partial";
      await supabase.from("fees").update({ status: newStatus }).eq("id", selectedFee.id);
      setPaymentDialogOpen(false);
      setPaymentForm({ amount: "", method: "card", reference: "", notes: "" });
      setSelectedFee(null);
      loadData();
    }
  }

  const totalFees = fees.reduce((s, f) => s + Number(f.amount), 0);
  const paidFees = fees.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);
  const outstanding = fees.filter((f) => f.status !== "paid").reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fee Management</h1>
        <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
          <DialogTrigger render={<Button className="bg-navy hover:bg-navy-light text-gold" />}>
            <Plus className="h-4 w-4 mr-2" /> Add Fee
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Fee</DialogTitle></DialogHeader>
            <form onSubmit={handleAddFee} className="space-y-4">
              <div className="space-y-2">
                <Label>Player</Label>
                <Select value={feeForm.player_id} onValueChange={(v) => setFeeForm({ ...feeForm, player_id: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger>
                  <SelectContent>{players.map((p) => (<SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Description</Label><Input value={feeForm.description} onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })} placeholder="Spring Registration" required /></div>
                <div className="space-y-2"><Label>Amount ($)</Label><Input type="number" step="0.01" value={feeForm.amount} onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={feeForm.due_date} onChange={(e) => setFeeForm({ ...feeForm, due_date: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={feeForm.category} onValueChange={(v) => setFeeForm({ ...feeForm, category: (v ?? "") as Fee["category"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FEE_CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-navy hover:bg-navy-light text-gold">Add Fee</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Total Fees</p><p className="text-xl font-bold">{formatCurrencyExact(totalFees)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Collected</p><p className="text-xl font-bold text-green-500">{formatCurrencyExact(paidFees)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Outstanding</p><p className="text-xl font-bold text-afl-red">{formatCurrencyExact(outstanding)}</p></CardContent></Card>
      </div>

      {/* Fee Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.player?.first_name} {f.player?.last_name}</TableCell>
                  <TableCell>{f.description}</TableCell>
                  <TableCell>{formatCurrencyExact(Number(f.amount))}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(f.due_date)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{f.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={f.status === "paid" ? "default" : f.status === "overdue" ? "destructive" : "outline"}>
                      {f.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {f.status !== "paid" && (
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedFee(f); setPaymentForm({ ...paymentForm, amount: String(f.amount) }); setPaymentDialogOpen(true); }}>
                        <CreditCard className="h-4 w-4 mr-1" /> Pay
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment{selectedFee && ` - ${selectedFee.description}`}</DialogTitle></DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Amount ($)</Label><Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required /></div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({ ...paymentForm, method: (v ?? "") as Payment["method"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Reference</Label><Input value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="Check #, transaction ID, etc." /></div>
            <Button type="submit" className="w-full bg-navy hover:bg-navy-light text-gold">Record Payment</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
