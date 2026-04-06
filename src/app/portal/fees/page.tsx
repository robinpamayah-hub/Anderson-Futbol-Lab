"use client";

import { usePlayerData } from "@/hooks/usePlayerData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyExact, formatDate } from "@/lib/utils";
import { DollarSign, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default function FeesPage() {
  const { fees, payments, loading } = usePlayerData();

  if (loading) return <div className="text-center text-muted-foreground p-8">Loading...</div>;

  const totalFees = fees.reduce((s, f) => s + Number(f.amount), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = totalFees - totalPaid;

  const statusIcon = (status: string) => {
    if (status === "paid") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "overdue") return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fees & Payments</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><DollarSign className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-xl font-bold">{formatCurrencyExact(totalFees)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-xl font-bold text-green-500">{formatCurrencyExact(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-afl-red/10"><AlertCircle className="h-5 w-5 text-afl-red" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className={`text-xl font-bold ${outstanding > 0 ? "text-afl-red" : "text-green-500"}`}>{formatCurrencyExact(outstanding)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.description}</TableCell>
                    <TableCell>{formatCurrencyExact(Number(f.amount))}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(f.due_date)}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize text-xs">{f.category}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {statusIcon(f.status)}
                        <Badge variant={f.status === "paid" ? "default" : f.status === "overdue" ? "destructive" : "outline"} className="capitalize">
                          {f.status}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">No fees on record.</div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">{formatDate(p.date)}</TableCell>
                    <TableCell className="font-medium text-green-500">{formatCurrencyExact(Number(p.amount))}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize text-xs">{p.method}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{p.reference || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
