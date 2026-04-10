export const dynamic = "force-dynamic";
"use client";

import { usePlayerData } from "@/hooks/usePlayerData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { PositionBadge } from "@/components/shared/PositionBadge";
import { AgeGroupBadge } from "@/components/shared/AgeGroupBadge";
import { formatCurrencyExact, formatDate, formatDateShort, getTrendDirection } from "@/lib/utils";
import {
  Trophy, ClipboardList, DollarSign, Calendar, Megaphone,
  TrendingUp, TrendingDown, Minus, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function PortalDashboard() {
  const { player, scores, assessments, feedback, fees, payments, announcements, upcomingSessions, loading } = usePlayerData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome to Anderson Futbol Lab</h2>
          <p className="text-muted-foreground">No player profile found for your account. Please contact the academy admin.</p>
        </CardContent>
      </Card>
    );
  }

  // Latest scores with trends
  const scoreMap = new Map<string, { latest: number; previous: number | null; assessment: string; higherIsBetter: boolean }>();
  scores.forEach((s) => {
    if (!s.assessment) return;
    const existing = scoreMap.get(s.assessment_id);
    if (!existing) {
      scoreMap.set(s.assessment_id, {
        latest: s.value,
        previous: null,
        assessment: s.assessment.name,
        higherIsBetter: s.assessment.higher_is_better,
      });
    } else if (existing.previous === null) {
      existing.previous = s.value;
    }
  });
  const topScores = Array.from(scoreMap.values()).slice(0, 4);

  // Fee summary
  const totalFees = fees.reduce((s, f) => s + Number(f.amount), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = totalFees - totalPaid;

  // Latest feedback
  const latestFeedback = feedback[0];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="border-gold/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <PlayerAvatar firstName={player.first_name} lastName={player.last_name} photoUrl={player.photo_url} className="h-16 w-16 text-xl" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Welcome, {player.first_name}!</h1>
              <div className="flex items-center gap-2 mt-1">
                <PositionBadge position={player.position} />
                <AgeGroupBadge ageGroup={player.age_group} />
                {player.team && <Badge variant="outline">{player.team.name}</Badge>}
              </div>
            </div>
            {upcomingSessions.length > 0 && (
              <div className="text-right hidden md:block">
                <p className="text-xs text-muted-foreground">Next Session</p>
                <p className="font-semibold">{formatDateShort(upcomingSessions[0].date)}</p>
                <p className="text-sm text-muted-foreground">{upcomingSessions[0].start_time} &middot; {upcomingSessions[0].type}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Latest Scores */}
        <Link href="/portal/scores">
          <Card className="hover:border-gold/30 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4 text-gold" /> Latest Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topScores.length > 0 ? (
                <div className="space-y-2">
                  {topScores.map((s, i) => {
                    const trend = s.previous !== null ? getTrendDirection(s.latest, s.previous, s.higherIsBetter) : "same";
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{s.assessment}</span>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{s.latest}</span>
                          {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
                          {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                          {trend === "same" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No scores yet</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Latest Feedback */}
        <Link href="/portal/feedback">
          <Card className="hover:border-gold/30 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <ClipboardList className="h-4 w-4 text-gold" /> Last Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestFeedback ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-gold">{latestFeedback.rating}</span>
                    <span className="text-xs text-muted-foreground">/10</span>
                    <span className="text-sm ml-auto">vs {latestFeedback.opponent}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{latestFeedback.strengths}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateShort(latestFeedback.date)}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No feedback yet</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Fee Status */}
        <Link href="/portal/fees">
          <Card className="hover:border-gold/30 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 text-gold" /> Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${outstanding > 0 ? "text-afl-red" : "text-green-500"}`}>
                    {formatCurrencyExact(outstanding)}
                  </p>
                  <p className="text-xs text-muted-foreground">{outstanding > 0 ? "Outstanding" : "All paid!"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-500">{formatCurrencyExact(totalPaid)}</p>
                  <p className="text-xs text-muted-foreground">Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-gold" /> Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.slice(0, 3).map((a) => (
              <div key={a.id} className={`p-3 rounded-lg ${a.priority === "urgent" ? "bg-red-500/5 border border-red-500/10" : a.priority === "important" ? "bg-yellow-500/5 border border-yellow-500/10" : "bg-muted/50"}`}>
                <div className="flex items-center gap-2">
                  {a.priority === "urgent" && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                  <span className="font-medium text-sm">{a.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{formatDateShort(a.date)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
