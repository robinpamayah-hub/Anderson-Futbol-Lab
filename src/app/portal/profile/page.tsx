export const dynamic = "force-dynamic";
"use client";

import { usePlayerData } from "@/hooks/usePlayerData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { PositionBadge } from "@/components/shared/PositionBadge";
import { AgeGroupBadge } from "@/components/shared/AgeGroupBadge";
import { calculateAge, formatDate } from "@/lib/utils";
import { User, Calendar, MapPin, Target } from "lucide-react";

export default function ProfilePage() {
  const { player, goals, attendance, loading } = usePlayerData();

  if (loading) return <div className="text-center text-muted-foreground p-8">Loading...</div>;
  if (!player) return <div className="text-center text-muted-foreground p-8">No player profile found.</div>;

  const attendanceTotal = attendance.length;
  const attendancePresent = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attendanceRate = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Player Profile</h1>

      <Card className="border-gold/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <PlayerAvatar firstName={player.first_name} lastName={player.last_name} photoUrl={player.photo_url} className="h-24 w-24 text-3xl" />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold">{player.first_name} {player.last_name}</h2>
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                <PositionBadge position={player.position} />
                {player.secondary_position && <PositionBadge position={player.secondary_position} />}
                <AgeGroupBadge ageGroup={player.age_group} />
              </div>
              {player.bio && <p className="mt-3 text-muted-foreground">{player.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><User className="h-5 w-5 text-blue-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="text-xl font-bold">{calculateAge(player.date_of_birth)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold/10"><Calendar className="h-5 w-5 text-gold" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-xl font-bold">{formatDate(player.join_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><MapPin className="h-5 w-5 text-green-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Team</p>
                <p className="text-xl font-bold">{player.team?.name || "Unassigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gold">{attendanceRate}%</p>
              <p className="text-sm text-muted-foreground">Rate</p>
            </div>
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${attendanceRate}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">{attendancePresent}/{attendanceTotal} sessions</p>
          </div>
        </CardContent>
      </Card>

      {/* Development Goals */}
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-gold" /> Development Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.map((g) => (
              <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Badge variant="outline" className="mb-1 capitalize text-xs">{g.category}</Badge>
                  <p className="font-medium text-sm">{g.description}</p>
                </div>
                <Badge variant={g.is_achieved ? "default" : "outline"} className={g.is_achieved ? "bg-green-500" : ""}>
                  {g.is_achieved ? "Achieved" : "In Progress"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
