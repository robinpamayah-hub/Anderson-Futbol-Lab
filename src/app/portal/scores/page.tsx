export const dynamic = "force-dynamic";
"use client";

import { useState } from "react";
import { usePlayerData } from "@/hooks/usePlayerData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, getTrendDirection, getTrendPercentage } from "@/lib/utils";
import { Trophy, TrendingUp, TrendingDown, Minus, Dumbbell, Crosshair, Brain } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { AssessmentCategory } from "@/lib/types";

export default function ScoresPage() {
  const { scores, assessments, loading } = usePlayerData();
  const [selectedCategory, setSelectedCategory] = useState<"all" | AssessmentCategory>("all");

  if (loading) return <div className="text-center text-muted-foreground p-8">Loading...</div>;

  // Build latest scores by assessment
  const latestByAssessment = new Map<string, { latest: number; previous: number | null }>();
  scores.forEach((s) => {
    const existing = latestByAssessment.get(s.assessment_id);
    if (!existing) {
      latestByAssessment.set(s.assessment_id, { latest: s.value, previous: null });
    } else if (existing.previous === null) {
      existing.previous = s.value;
    }
  });

  // Radar chart data (score/10 assessments only)
  const radarData = assessments
    .filter((a) => a.unit === "score/10" && latestByAssessment.has(a.id))
    .map((a) => ({
      subject: a.name.replace(" (GK)", "").replace(" Accuracy", ""),
      value: latestByAssessment.get(a.id)?.latest || 0,
      fullMark: 10,
    }));

  // Score trend charts - group scores by assessment
  const scoresByAssessment = new Map<string, { name: string; category: string; unit: string; higherIsBetter: boolean; data: { date: string; value: number }[] }>();
  assessments.forEach((a) => {
    const assessScores = scores
      .filter((s) => s.assessment_id === a.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((s) => ({ date: s.date, value: s.value }));
    if (assessScores.length > 0) {
      scoresByAssessment.set(a.id, {
        name: a.name, category: a.category, unit: a.unit,
        higherIsBetter: a.higher_is_better, data: assessScores,
      });
    }
  });

  const filteredAssessments = Array.from(scoresByAssessment.entries())
    .filter(([, v]) => selectedCategory === "all" || v.category === selectedCategory);

  const categoryIcon = (cat: string) => {
    if (cat === "fitness") return <Dumbbell className="h-3.5 w-3.5" />;
    if (cat === "technical") return <Crosshair className="h-3.5 w-3.5" />;
    return <Brain className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scores & Assessments</h1>

      {/* Radar Chart */}
      {radarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-gold" /> Skill Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-border" />
                <PolarAngleAxis dataKey="subject" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="value" stroke="#C5A55A" fill="#C5A55A" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory((v ?? "") as "all" | AssessmentCategory)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="fitness" className="gap-1"><Dumbbell className="h-3.5 w-3.5" /> Fitness</TabsTrigger>
          <TabsTrigger value="technical" className="gap-1"><Crosshair className="h-3.5 w-3.5" /> Technical</TabsTrigger>
          <TabsTrigger value="tactical" className="gap-1"><Brain className="h-3.5 w-3.5" /> Tactical</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Score Trend Charts */}
      {filteredAssessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssessments.map(([id, assess]) => {
            const latest = latestByAssessment.get(id);
            const trend = latest?.previous !== null && latest?.previous !== undefined
              ? getTrendDirection(latest.latest, latest.previous, assess.higherIsBetter)
              : "same";

            return (
              <Card key={id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {categoryIcon(assess.category)}
                      {assess.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{latest?.latest}</span>
                      <span className="text-xs text-muted-foreground">{assess.unit}</span>
                      {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {trend === "same" && <Minus className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={assess.data}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short" })} />
                      <YAxis tick={{ fontSize: 10 }} width={30} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                        labelFormatter={(d) => formatDate(d)}
                      />
                      <Line type="monotone" dataKey="value" stroke="#C5A55A" strokeWidth={2} dot={{ fill: "#C5A55A", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No scores recorded yet.</CardContent></Card>
      )}

      {/* Score History Table */}
      {scores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.slice(0, 20).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.assessment?.name}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize text-xs">{s.assessment?.category}</Badge></TableCell>
                    <TableCell>{s.value} {s.assessment?.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(s.date)}</TableCell>
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
