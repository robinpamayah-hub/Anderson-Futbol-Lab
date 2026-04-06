"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { PositionBadge } from "@/components/shared/PositionBadge";
import { AgeGroupBadge } from "@/components/shared/AgeGroupBadge";
import { formatCurrencyExact, formatDate, calculateAge } from "@/lib/utils";
import {
  ArrowLeft, Trophy, ClipboardList, DollarSign, CalendarCheck, Target,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import type { Player, PlayerScore, GameFeedback, Fee, Payment, AttendanceRecord, AssessmentTemplate, DevelopmentGoal } from "@/lib/types";

export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = params.id as string;
  const [player, setPlayer] = useState<Player | null>(null);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [assessments, setAssessments] = useState<AssessmentTemplate[]>([]);
  const [feedback, setFeedback] = useState<GameFeedback[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [goals, setGoals] = useState<DevelopmentGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [
        { data: playerData },
        { data: scoresData },
        { data: assessData },
        { data: feedbackData },
        { data: feesData },
        { data: paymentsData },
        { data: attendanceData },
        { data: goalsData },
      ] = await Promise.all([
        supabase.from("players").select("*, team:teams(*)").eq("id", playerId).single(),
        supabase.from("player_scores").select("*, assessment:assessment_templates(*)").eq("player_id", playerId).order("date", { ascending: false }),
        supabase.from("assessment_templates").select("*"),
        supabase.from("game_feedback").select("*").eq("player_id", playerId).order("date", { ascending: false }),
        supabase.from("fees").select("*").eq("player_id", playerId).order("due_date", { ascending: false }),
        supabase.from("payments").select("*").eq("player_id", playerId).order("date", { ascending: false }),
        supabase.from("attendance").select("*").eq("player_id", playerId).order("date", { ascending: false }),
        supabase.from("development_goals").select("*").eq("player_id", playerId).order("target_date"),
      ]);
      setPlayer(playerData as Player);
      setScores((scoresData || []) as PlayerScore[]);
      setAssessments((assessData || []) as AssessmentTemplate[]);
      setFeedback((feedbackData || []) as GameFeedback[]);
      setFees((feesData || []) as Fee[]);
      setPayments((paymentsData || []) as Payment[]);
      setAttendance((attendanceData || []) as AttendanceRecord[]);
      setGoals((goalsData || []) as DevelopmentGoal[]);
      setLoading(false);
    }
    load();
  }, [playerId]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading player...</div>;
  if (!player) return <div className="p-8 text-center text-muted-foreground">Player not found</div>;

  // Build radar chart data from latest scores
  const latestScoresByAssessment = new Map<string, number>();
  scores.forEach((s) => {
    if (!latestScoresByAssessment.has(s.assessment_id)) {
      latestScoresByAssessment.set(s.assessment_id, s.value);
    }
  });

  const radarData = assessments
    .filter((a) => a.unit === "score/10" && latestScoresByAssessment.has(a.id))
    .map((a) => ({
      subject: a.name.replace(" (GK)", "").replace(" Accuracy", ""),
      value: latestScoresByAssessment.get(a.id) || 0,
      fullMark: 10,
    }));

  // Fee summary
  const totalFees = fees.reduce((s, f) => s + Number(f.amount), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = totalFees - totalPaid;

  // Attendance summary
  const attendanceTotal = attendance.length;
  const attendancePresent = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attendanceRate = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/players">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <PlayerAvatar firstName={player.first_name} lastName={player.last_name} photoUrl={player.photo_url} className="h-20 w-20 text-2xl" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{player.first_name} {player.last_name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <PositionBadge position={player.position} />
                <AgeGroupBadge ageGroup={player.age_group} />
                {player.team && <Badge variant="outline">{player.team.name}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Age {calculateAge(player.date_of_birth)} &middot; Joined {formatDate(player.join_date)}
              </p>
              {player.bio && <p className="text-sm mt-2">{player.bio}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gold">{attendanceRate}%</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{feedback.length}</p>
                <p className="text-xs text-muted-foreground">Games</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${outstanding > 0 ? "text-afl-red" : "text-green-500"}`}>
                  {formatCurrencyExact(outstanding)}
                </p>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="scores">
        <TabsList>
          <TabsTrigger value="scores" className="gap-1"><Trophy className="h-3.5 w-3.5" /> Scores</TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1"><ClipboardList className="h-3.5 w-3.5" /> Feedback</TabsTrigger>
          <TabsTrigger value="fees" className="gap-1"><DollarSign className="h-3.5 w-3.5" /> Fees</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1"><CalendarCheck className="h-3.5 w-3.5" /> Attendance</TabsTrigger>
          <TabsTrigger value="development" className="gap-1"><Target className="h-3.5 w-3.5" /> Development</TabsTrigger>
        </TabsList>

        {/* Scores Tab */}
        <TabsContent value="scores" className="space-y-4">
          {radarData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Skill Overview</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis dataKey="subject" className="text-xs" />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                    <Radar name="Score" dataKey="value" stroke="#C5A55A" fill="#C5A55A" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Score History</CardTitle></CardHeader>
            <CardContent>
              {scores.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scores.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.assessment?.name}</TableCell>
                        <TableCell>{s.value} {s.assessment?.unit}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(s.date)}</TableCell>
                        <TableCell className="text-muted-foreground">{s.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No scores recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          {feedback.length > 0 ? (
            feedback.map((fb) => (
              <Card key={fb.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">vs {fb.opponent}</span>
                      {fb.result && <Badge variant="outline">{fb.result}</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <PositionBadge position={fb.position_played} />
                      <span className="text-sm text-muted-foreground">{formatDate(fb.date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-gold">{fb.rating}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{fb.minutes_played} min played</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                      <p className="font-medium text-green-600 dark:text-green-400 mb-1">Strengths</p>
                      <p>{fb.strengths}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                      <p className="font-medium text-orange-600 dark:text-orange-400 mb-1">Areas to Improve</p>
                      <p>{fb.areas_to_improve}</p>
                    </div>
                  </div>
                  {fb.coach_notes && (
                    <p className="text-sm text-muted-foreground mt-3 italic">{fb.coach_notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card><CardContent className="p-8"><p className="text-center text-muted-foreground">No game feedback yet</p></CardContent></Card>
          )}
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-xl font-bold">{formatCurrencyExact(totalFees)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-xl font-bold text-green-500">{formatCurrencyExact(totalPaid)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className={`text-xl font-bold ${outstanding > 0 ? "text-afl-red" : "text-green-500"}`}>{formatCurrencyExact(outstanding)}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.description}</TableCell>
                      <TableCell>{formatCurrencyExact(Number(f.amount))}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(f.due_date)}</TableCell>
                      <TableCell>
                        <Badge variant={f.status === "paid" ? "default" : f.status === "overdue" ? "destructive" : "outline"}>
                          {f.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-3xl font-bold">{attendanceRate}%</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{attendancePresent} present / {attendanceTotal} sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{formatDate(a.date)}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "present" ? "default" : a.status === "absent" ? "destructive" : "outline"}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Development Tab */}
        <TabsContent value="development" className="space-y-4">
          {goals.length > 0 ? (
            goals.map((g) => (
              <Card key={g.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2 capitalize">{g.category}</Badge>
                      <p className="font-medium">{g.description}</p>
                      {g.notes && <p className="text-sm text-muted-foreground mt-1">{g.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Target: {formatDate(g.target_date)}</p>
                      <Badge variant={g.is_achieved ? "default" : "outline"} className={g.is_achieved ? "bg-green-500 mt-1" : "mt-1"}>
                        {g.is_achieved ? "Achieved" : "In Progress"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card><CardContent className="p-8"><p className="text-center text-muted-foreground">No development goals set</p></CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
