"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyExact } from "@/lib/utils";
import {
  Users,
  Shield,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Calendar,
  Megaphone,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Player, Team, Fee, Announcement, TrainingSession } from "@/lib/types";

interface DashboardStats {
  totalPlayers: number;
  activeTeams: number;
  feesCollected: number;
  feesOutstanding: number;
  feesByTeam: { name: string; collected: number; outstanding: number }[];
  upcomingSessions: (TrainingSession & { team?: Team })[];
  recentAnnouncements: Announcement[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboard() {
      const [
        { data: players },
        { data: teams },
        { data: fees },
        { data: sessions },
        { data: announcements },
        { data: payments },
      ] = await Promise.all([
        supabase.from("players").select("*, team:teams(*)").eq("is_active", true),
        supabase.from("teams").select("*"),
        supabase.from("fees").select("*, player:players(*, team:teams(*))"),
        supabase.from("training_sessions").select("*, team:teams(*)").gte("date", new Date().toISOString().split("T")[0]).order("date").limit(5),
        supabase.from("announcements").select("*").order("date", { ascending: false }).limit(3),
        supabase.from("payments").select("*"),
      ]);

      const totalPayments = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const totalFees = (fees || []).reduce((sum, f) => sum + Number(f.amount), 0);

      // Calculate fees by team
      const teamMap = new Map<string, { name: string; collected: number; outstanding: number }>();
      (teams || []).forEach((t) => teamMap.set(t.id, { name: t.name, collected: 0, outstanding: 0 }));

      (fees || []).forEach((f) => {
        const teamId = f.player?.team_id;
        if (teamId && teamMap.has(teamId)) {
          const entry = teamMap.get(teamId)!;
          if (f.status === "paid") {
            entry.collected += Number(f.amount);
          } else {
            entry.outstanding += Number(f.amount);
          }
        }
      });

      setStats({
        totalPlayers: (players || []).length,
        activeTeams: (teams || []).length,
        feesCollected: totalPayments,
        feesOutstanding: totalFees - totalPayments,
        feesByTeam: Array.from(teamMap.values()),
        upcomingSessions: (sessions || []) as (TrainingSession & { team?: Team })[],
        recentAnnouncements: (announcements || []) as Announcement[],
      });
      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const summaryCards = [
    {
      title: "Total Players",
      value: stats.totalPlayers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Teams",
      value: stats.activeTeams,
      icon: Shield,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Fees Collected",
      value: formatCurrencyExact(stats.feesCollected),
      icon: DollarSign,
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
    {
      title: "Outstanding",
      value: formatCurrencyExact(stats.feesOutstanding),
      icon: AlertCircle,
      color: "text-afl-red",
      bgColor: "bg-afl-red/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Badge variant="outline" className="text-gold border-gold/30">
          Admin
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee Collection Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-gold" />
              Fee Collection by Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.feesByTeam.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.feesByTeam}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="collected" fill="#C5A55A" name="Collected" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outstanding" fill="#C41E3A" name="Outstanding" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No fee data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions & Announcements */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-gold" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.upcomingSessions.length > 0 ? (
                stats.upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{session.team?.name || "TBD"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.date).toLocaleDateString()} &middot; {session.start_time}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {session.type}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming sessions</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-4 w-4 text-gold" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.recentAnnouncements.length > 0 ? (
                stats.recentAnnouncements.map((ann) => (
                  <div key={ann.id} className="text-sm p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{ann.title}</p>
                      {ann.priority !== "normal" && (
                        <Badge
                          variant={ann.priority === "urgent" ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {ann.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No announcements</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
