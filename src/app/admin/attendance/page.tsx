export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { ATTENDANCE_STATUSES } from "@/lib/constants";
import { CalendarCheck, Save } from "lucide-react";
import type { Team, Player, TrainingSession, AttendanceStatus } from "@/lib/types";

export default function AttendancePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [attendanceInputs, setAttendanceInputs] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.from("teams").select("*").order("name").then(({ data }) => setTeams((data || []) as Team[]));
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    Promise.all([
      supabase.from("training_sessions").select("*").eq("team_id", selectedTeam).order("date", { ascending: false }).limit(20),
      supabase.from("players").select("*").eq("team_id", selectedTeam).eq("is_active", true).order("last_name"),
    ]).then(([{ data: s }, { data: p }]) => {
      setSessions((s || []) as TrainingSession[]);
      setPlayers((p || []) as Player[]);
    });
  }, [selectedTeam]);

  useEffect(() => {
    if (!selectedSession) return;
    supabase.from("attendance").select("*").eq("session_id", selectedSession).then(({ data }) => {
      const map: Record<string, AttendanceStatus> = {};
      (data || []).forEach((a) => { map[a.player_id] = a.status as AttendanceStatus; });
      setAttendanceInputs(map);
    });
  }, [selectedSession]);

  async function handleSave() {
    if (!selectedSession) return;
    setSaving(true);
    const session = sessions.find((s) => s.id === selectedSession);

    const entries = Object.entries(attendanceInputs).map(([playerId, status]) => ({
      player_id: playerId,
      session_id: selectedSession,
      date: session?.date || new Date().toISOString().split("T")[0],
      status,
      notes: "",
    }));

    // Upsert: delete existing then insert
    await supabase.from("attendance").delete().eq("session_id", selectedSession);
    if (entries.length > 0) {
      await supabase.from("attendance").insert(entries);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  }

  const selectedSessionObj = sessions.find((s) => s.id === selectedSession);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={selectedTeam} onValueChange={(v) => { setSelectedTeam(v ?? ""); setSelectedSession(""); }}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>{teams.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Session</Label>
              <Select value={selectedSession} onValueChange={(v) => setSelectedSession(v ?? "")} disabled={!selectedTeam}>
                <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {new Date(s.date).toLocaleDateString()} - {s.type} ({s.start_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSession && players.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-gold" />
                {selectedSessionObj && `${new Date(selectedSessionObj.date).toLocaleDateString()} - ${selectedSessionObj.type}`}
              </CardTitle>
              <Button onClick={handleSave} disabled={saving} className="bg-navy hover:bg-navy-light text-gold">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : saved ? "Saved!" : "Save Attendance"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Status</TableHead>
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
                      <div className="flex gap-1">
                        {ATTENDANCE_STATUSES.map((s) => (
                          <Button
                            key={s.value}
                            variant={attendanceInputs[p.id] === s.value ? "default" : "outline"}
                            size="sm"
                            className={attendanceInputs[p.id] === s.value ? (
                              s.value === "present" ? "bg-green-600 hover:bg-green-700" :
                              s.value === "absent" ? "bg-red-600 hover:bg-red-700" :
                              s.value === "late" ? "bg-yellow-600 hover:bg-yellow-700" :
                              "bg-blue-600 hover:bg-blue-700"
                            ) : ""}
                            onClick={() => setAttendanceInputs({ ...attendanceInputs, [p.id]: s.value as AttendanceStatus })}
                          >
                            {s.label}
                          </Button>
                        ))}
                      </div>
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
