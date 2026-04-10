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
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { PositionBadge } from "@/components/shared/PositionBadge";
import { POSITIONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Plus, ClipboardList } from "lucide-react";
import type { Player, GameFeedback, Position } from "@/lib/types";

export default function FeedbackPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [feedbackList, setFeedbackList] = useState<(GameFeedback & { player?: Player })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    player_id: "", date: new Date().toISOString().split("T")[0], opponent: "",
    result: "", minutes_played: 0, position_played: "MID" as Position,
    rating: 7, strengths: "", areas_to_improve: "", coach_notes: "",
  });

  const supabase = createClient();

  async function loadData() {
    const [{ data: p }, { data: fb }] = await Promise.all([
      supabase.from("players").select("*").eq("is_active", true).order("last_name"),
      supabase.from("game_feedback").select("*, player:players(*)").order("date", { ascending: false }).limit(50),
    ]);
    setPlayers((p || []) as Player[]);
    setFeedbackList((fb || []) as (GameFeedback & { player?: Player })[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("game_feedback").insert({
      player_id: form.player_id,
      date: form.date,
      opponent: form.opponent,
      result: form.result || null,
      minutes_played: form.minutes_played,
      position_played: form.position_played,
      rating: form.rating,
      strengths: form.strengths,
      areas_to_improve: form.areas_to_improve,
      coach_notes: form.coach_notes,
      recorded_by: user?.id,
    });
    if (!error) {
      setDialogOpen(false);
      setForm({ player_id: "", date: new Date().toISOString().split("T")[0], opponent: "", result: "", minutes_played: 0, position_played: "MID", rating: 7, strengths: "", areas_to_improve: "", coach_notes: "" });
      loadData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Game Feedback</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-navy hover:bg-navy-light text-gold" />}>
            <Plus className="h-4 w-4 mr-2" /> Add Feedback
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Game Feedback</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Player</Label>
                  <Select value={form.player_id} onValueChange={(v) => setForm({ ...form, player_id: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger>
                    <SelectContent>{players.map((p) => (<SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Opponent</Label>
                  <Input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Result</Label>
                  <Input value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="3-1 W" />
                </div>
                <div className="space-y-2">
                  <Label>Minutes</Label>
                  <Input type="number" value={form.minutes_played} onChange={(e) => setForm({ ...form, minutes_played: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Position Played</Label>
                  <Select value={form.position_played} onValueChange={(v) => setForm({ ...form, position_played: (v ?? "") as Position })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{POSITIONS.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rating (1-10)</Label>
                  <Input type="number" min={1} max={10} value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) || 7 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Strengths</Label>
                <Textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} placeholder="What did the player do well?" />
              </div>
              <div className="space-y-2">
                <Label>Areas to Improve</Label>
                <Textarea value={form.areas_to_improve} onChange={(e) => setForm({ ...form, areas_to_improve: e.target.value })} placeholder="What can be improved?" />
              </div>
              <div className="space-y-2">
                <Label>Coach Notes</Label>
                <Textarea value={form.coach_notes} onChange={(e) => setForm({ ...form, coach_notes: e.target.value })} placeholder="Additional notes..." />
              </div>
              <Button type="submit" className="w-full bg-navy hover:bg-navy-light text-gold">Save Feedback</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground p-8">Loading...</div>
      ) : feedbackList.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No game feedback recorded yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((fb) => (
            <Card key={fb.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {fb.player && <PlayerAvatar firstName={fb.player.first_name} lastName={fb.player.last_name} className="h-8 w-8 text-xs" />}
                    <div>
                      <span className="font-semibold">{fb.player?.first_name} {fb.player?.last_name}</span>
                      <span className="text-muted-foreground"> vs {fb.opponent}</span>
                    </div>
                    {fb.result && <Badge variant="outline">{fb.result}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gold">{fb.rating}</span>
                    <span className="text-xs text-muted-foreground">/10</span>
                    <span className="text-sm text-muted-foreground ml-2">{formatDate(fb.date)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 rounded bg-green-500/5"><p className="font-medium text-green-600 dark:text-green-400 text-xs mb-1">Strengths</p><p>{fb.strengths}</p></div>
                  <div className="p-2 rounded bg-orange-500/5"><p className="font-medium text-orange-600 dark:text-orange-400 text-xs mb-1">To Improve</p><p>{fb.areas_to_improve}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
