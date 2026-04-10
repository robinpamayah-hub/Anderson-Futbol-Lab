export const dynamic = "force-dynamic";
"use client";

import { usePlayerData } from "@/hooks/usePlayerData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PositionBadge } from "@/components/shared/PositionBadge";
import { formatDate } from "@/lib/utils";
import { ClipboardList, Star } from "lucide-react";

export default function FeedbackPage() {
  const { feedback, loading } = usePlayerData();

  if (loading) return <div className="text-center text-muted-foreground p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Game Feedback</h1>

      {feedback.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No game feedback yet. Feedback from coaches will appear here after games.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedback.map((fb) => (
            <Card key={fb.id}>
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-gold fill-gold" />
                      <span className="text-3xl font-bold text-gold">{fb.rating}</span>
                      <span className="text-sm text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PositionBadge position={fb.position_played} />
                    <span className="text-sm text-muted-foreground">{formatDate(fb.date)}</span>
                  </div>
                </div>

                {/* Match Info */}
                <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">vs</span>
                    <span className="font-semibold ml-1">{fb.opponent}</span>
                  </div>
                  {fb.result && <Badge variant="outline" className="font-mono">{fb.result}</Badge>}
                  <span className="text-sm text-muted-foreground">{fb.minutes_played} min</span>
                </div>

                {/* Strengths & Areas to Improve */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                    <p className="font-semibold text-green-600 dark:text-green-400 text-sm mb-2">Strengths</p>
                    <p className="text-sm">{fb.strengths || "No notes"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <p className="font-semibold text-orange-600 dark:text-orange-400 text-sm mb-2">Areas to Improve</p>
                    <p className="text-sm">{fb.areas_to_improve || "No notes"}</p>
                  </div>
                </div>

                {/* Coach Notes */}
                {fb.coach_notes && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border-l-2 border-gold">
                    <p className="text-xs text-muted-foreground mb-1">Coach Notes</p>
                    <p className="text-sm italic">{fb.coach_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
