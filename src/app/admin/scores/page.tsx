export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { Trophy, Save } from "lucide-react";
import type { Team, Player, AssessmentTemplate } from "@/lib/types";

export default function ScoresPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [assessments, setAssessments] = useState<AssessmentTemplate[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { value: string; notes: string }>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: a }] = await Promise.all([
        supabase.from("teams").select("*").order("name"),
        supabase.from("assessment_templates").select("*").order("category").order("name"),
      ]);
      setTeams((t || []) as Team[]);
      setAssessments((a || []) as AssessmentTemplate[]);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    async function loadPlayers() {
      const { data } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", selectedTeam)
        .eq("is_active", true)
        .order("last_name");
      setPlayers((data || []) as Player[]);
      setScoreInputs({});
    }
    loadPlayers();
  }, [selectedTeam]);

  async function handleSave() {
    if (!selectedAssessment || !date) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    const entries = Object.entries(scoreInputs)
      .filter(([, v]) => v.value !== "")
      .map(([playerId, v]) => ({
        player_id: playerId,
        assessment_id: selectedAssessment,
        value: parseFloat(v.value),
        date,
        notes: v.notes,
        recorded_by: user?.id,
      }));

    if (entries.length > 0) {
      await supabase.from("player_scores").insert(entries);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setScoreInputs({});
    }
    setSaving(false);
  }

  const selectedAssessmentObj = assessments.find((a) => a.id === selectedAssessment);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Score Entry</h1>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={selectedTeam} onValueChange={(v) => setSelectedTeam(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>{teams.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assessment</Label>
              <Select value={selectedAssessment} onValueChange={(v) => setSelectedAssessment(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select assessment" /></SelectTrigger>
                <SelectContent>
                  {assessments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTeam && selectedAssessment && players.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold" />
                {selectedAssessmentObj?.name} - Enter Scores ({selectedAssessmentObj?.unit})
              </CardTitle>
              <Button onClick={handleSave} disabled={saving} className="bg-navy hover:bg-navy-light text-gold">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : saved ? "Saved!" : "Save Scores"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="w-[140px]">Score ({selectedAssessmentObj?.unit})</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PlayerAvatar firstName={p.first_name} lastName={p.last_name} className="h-7 w-7 text-xs" />
                        <span className="font-medium">{p.first_name} {p.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={scoreInputs[p.id]?.value || ""}
                        onChange={(e) => setScoreInputs({
                          ...scoreInputs,
                          [p.id]: { ...scoreInputs[p.id], value: e.target.value, notes: scoreInputs[p.id]?.notes || "" },
                        })}
                        className="w-[120px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Optional notes"
                        value={scoreInputs[p.id]?.notes || ""}
                        onChange={(e) => setScoreInputs({
                          ...scoreInputs,
                          [p.id]: { ...scoreInputs[p.id], notes: e.target.value, value: scoreInputs[p.id]?.value || "" },
                        })}
                      />
                    </TableCell>
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
