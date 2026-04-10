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
import { AgeGroupBadge } from "@/components/shared/AgeGroupBadge";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { PositionBadge } from "@/components/shared/PositionBadge";
import { AGE_GROUPS } from "@/lib/constants";
import { Plus, Users, Shield } from "lucide-react";
import type { Team, Player, AgeGroup } from "@/lib/types";

export default function TeamsPage() {
  const [teams, setTeams] = useState<(Team & { players: Player[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", age_group: "U12" as AgeGroup, season: "Spring 2026",
    coach_name: "", assistant_coach_name: "", max_roster_size: 20,
  });

  const supabase = createClient();

  async function loadTeams() {
    const { data: teamsData } = await supabase.from("teams").select("*").order("name");
    const { data: playersData } = await supabase.from("players").select("*").eq("is_active", true);

    const teamsWithPlayers = (teamsData || []).map((t) => ({
      ...t,
      players: (playersData || []).filter((p) => p.team_id === t.id),
    }));
    setTeams(teamsWithPlayers as (Team & { players: Player[] })[]);
    setLoading(false);
  }

  useEffect(() => { loadTeams(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("teams").insert({
      name: form.name,
      age_group: form.age_group,
      season: form.season,
      coach_name: form.coach_name,
      assistant_coach_name: form.assistant_coach_name || null,
      max_roster_size: form.max_roster_size,
    });
    if (!error) {
      setDialogOpen(false);
      setForm({ name: "", age_group: "U12", season: "Spring 2026", coach_name: "", assistant_coach_name: "", max_roster_size: 20 });
      loadTeams();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-navy hover:bg-navy-light text-gold" />}>
            <Plus className="h-4 w-4 mr-2" /> Add Team
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Team</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. U12 Blue" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Age Group</Label>
                  <Select value={form.age_group} onValueChange={(v) => setForm({ ...form, age_group: (v ?? "") as AgeGroup })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{AGE_GROUPS.map((ag) => (<SelectItem key={ag.value} value={ag.value}>{ag.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Season</Label>
                  <Input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Head Coach</Label>
                  <Input value={form.coach_name} onChange={(e) => setForm({ ...form, coach_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Assistant Coach</Label>
                  <Input value={form.assistant_coach_name} onChange={(e) => setForm({ ...form, assistant_coach_name: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Max Roster Size</Label>
                <Input type="number" value={form.max_roster_size} onChange={(e) => setForm({ ...form, max_roster_size: parseInt(e.target.value) || 20 })} />
              </div>
              <Button type="submit" className="w-full bg-navy hover:bg-navy-light text-gold">Add Team</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-32 bg-muted rounded" /></CardContent></Card>)}
        </div>
      ) : teams.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No teams yet. Create your first team to get started.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <AgeGroupBadge ageGroup={team.age_group} />
                </div>
                <p className="text-sm text-muted-foreground">{team.season} &middot; Coach {team.coach_name}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{team.players.length} / {team.max_roster_size}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {team.players.slice(0, 8).map((p) => (
                    <PlayerAvatar key={p.id} firstName={p.first_name} lastName={p.last_name} photoUrl={p.photo_url} className="h-8 w-8 text-xs" />
                  ))}
                  {team.players.length > 8 && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      +{team.players.length - 8}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
