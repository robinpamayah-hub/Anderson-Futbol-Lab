"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { PositionBadge } from "@/components/shared/PositionBadge";
import { AgeGroupBadge } from "@/components/shared/AgeGroupBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { AGE_GROUPS, POSITIONS } from "@/lib/constants";
import { calculateAge } from "@/lib/utils";
import { Plus, Search, Users, Eye } from "lucide-react";
import type { Player, Team, Profile } from "@/lib/types";
import type { AgeGroup, Position } from "@/lib/types";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [parents, setParents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterPosition, setFilterPosition] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    age_group: "U12" as AgeGroup,
    position: "MID" as Position,
    secondary_position: "" as string,
    team_id: "",
    parent_id: "",
    bio: "",
  });

  const supabase = createClient();

  async function loadData() {
    const [{ data: playersData }, { data: teamsData }, { data: parentsData }] = await Promise.all([
      supabase.from("players").select("*, team:teams(*)").eq("is_active", true).order("last_name"),
      supabase.from("teams").select("*").order("name"),
      supabase.from("profiles").select("*").eq("role", "parent"),
    ]);
    setPlayers((playersData || []) as Player[]);
    setTeams((teamsData || []) as Team[]);
    setParents((parentsData || []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("players").insert({
      first_name: formData.first_name,
      last_name: formData.last_name,
      date_of_birth: formData.date_of_birth,
      age_group: formData.age_group,
      position: formData.position,
      secondary_position: formData.secondary_position || null,
      team_id: formData.team_id || null,
      parent_id: formData.parent_id || null,
      bio: formData.bio,
    });
    if (!error) {
      setDialogOpen(false);
      setFormData({
        first_name: "", last_name: "", date_of_birth: "", age_group: "U12",
        position: "MID", secondary_position: "", team_id: "", parent_id: "", bio: "",
      });
      loadData();
    }
  }

  const filtered = players.filter((p) => {
    const matchesSearch = `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = filterTeam === "all" || p.team_id === filterTeam;
    const matchesPosition = filterPosition === "all" || p.position === filterPosition;
    return matchesSearch && matchesTeam && matchesPosition;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Players</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-navy hover:bg-navy-light text-gold" />}>
            <Plus className="h-4 w-4 mr-2" />
            Add Player
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Age Group</Label>
                  <Select value={formData.age_group} onValueChange={(v) => setFormData({ ...formData, age_group: (v ?? "") as AgeGroup })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AGE_GROUPS.map((ag) => (
                        <SelectItem key={ag.value} value={ag.value}>{ag.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: (v ?? "") as Position })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select value={formData.team_id} onValueChange={(v) => setFormData({ ...formData, team_id: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Parent</Label>
                <Select value={formData.parent_id} onValueChange={(v) => setFormData({ ...formData, parent_id: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                  <SelectContent>
                    {parents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Short player bio..." />
              </div>
              <Button type="submit" className="w-full bg-navy hover:bg-navy-light text-gold">Add Player</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTeam} onValueChange={(v) => setFilterTeam(v ?? "")}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Teams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPosition} onValueChange={(v) => setFilterPosition(v ?? "")}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Positions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {POSITIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Player Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No players found"
              description={search ? "Try adjusting your search filters" : "Add your first player to get started"}
              action={
                <Button onClick={() => setDialogOpen(true)} className="bg-navy hover:bg-navy-light text-gold">
                  <Plus className="h-4 w-4 mr-2" /> Add Player
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <PlayerAvatar firstName={player.first_name} lastName={player.last_name} photoUrl={player.photo_url} />
                        <div>
                          <p className="font-medium">{player.first_name} {player.last_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><PositionBadge position={player.position} /></TableCell>
                    <TableCell><AgeGroupBadge ageGroup={player.age_group} /></TableCell>
                    <TableCell className="text-muted-foreground">{player.team?.name || "Unassigned"}</TableCell>
                    <TableCell className="text-muted-foreground">{calculateAge(player.date_of_birth)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/players/${player.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
