export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SESSION_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Plus, Dumbbell, MapPin, Clock } from "lucide-react";
import type { Team, TrainingSession } from "@/lib/types";

export default function SessionsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [sessions, setSessions] = useState<(TrainingSession & { team?: Team })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    team_id: "", date: new Date().toISOString().split("T")[0],
    start_time: "17:00", end_time: "18:30", location: "",
    type: "training" as TrainingSession["type"], plan: "", focus: "",
  });

  const supabase = createClient();

  async function loadData() {
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase.from("training_sessions").select("*, team:teams(*)").order("date", { ascending: false }).limit(50),
    ]);
    setTeams((t || []) as Team[]);
    setSessions((s || []) as (TrainingSession & { team?: Team })[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("training_sessions").insert({
      team_id: form.team_id,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location,
      type: form.type,
      plan: form.plan,
      focus: form.focus.split(",").map((s) => s.trim()).filter(Boolean),
    });
    if (!error) {
      setDialogOpen(false);
      setForm({ team_id: "", date: new Date().toISOString().split("T")[0], start_time: "17:00", end_time: "18:30", location: "", type: "training", plan: "", focus: "" });
      loadData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Training Sessions</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-navy hover:bg-navy-light text-gold" />}>
            <Plus className="h-4 w-4 mr-2" /> Add Session
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Training Session</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                    <SelectContent>{teams.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: (v ?? "") as TrainingSession["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SESSION_TYPES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Start</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required /></div>
                <div className="space-y-2"><Label>End</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Field name or address" required /></div>
              <div className="space-y-2"><Label>Focus Areas (comma-separated)</Label><Input value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} placeholder="passing, defensive shape, shooting" /></div>
              <div className="space-y-2"><Label>Session Plan</Label><Textarea value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} placeholder="Warm up, drills, scrimmage..." rows={3} /></div>
              <Button type="submit" className="w-full bg-navy hover:bg-navy-light text-gold">Add Session</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground p-8">Loading...</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gold/10">
                      <Dumbbell className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{s.team?.name}</span>
                        <Badge variant="outline" className="capitalize">{s.type}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.start_time} - {s.end_time}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatDate(s.date)}</p>
                    {s.focus.length > 0 && (
                      <div className="flex gap-1 mt-1 justify-end">
                        {s.focus.map((f, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {s.plan && <p className="text-sm text-muted-foreground mt-3 border-t pt-3">{s.plan}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
