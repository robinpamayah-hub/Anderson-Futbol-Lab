"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Player, PlayerScore, GameFeedback, Fee, Payment,
  AttendanceRecord, Announcement, AssessmentTemplate, DevelopmentGoal, TrainingSession,
} from "@/lib/types";

export interface PlayerData {
  player: Player | null;
  scores: PlayerScore[];
  assessments: AssessmentTemplate[];
  feedback: GameFeedback[];
  fees: Fee[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  goals: DevelopmentGoal[];
  upcomingSessions: TrainingSession[];
  loading: boolean;
}

export function usePlayerData(): PlayerData {
  const [data, setData] = useState<PlayerData>({
    player: null, scores: [], assessments: [], feedback: [],
    fees: [], payments: [], attendance: [], announcements: [],
    goals: [], upcomingSessions: [], loading: true,
  });

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the parent's first player
      const { data: players } = await supabase
        .from("players")
        .select("*, team:teams(*)")
        .eq("parent_id", user.id)
        .eq("is_active", true)
        .limit(1);

      const player = players?.[0] as Player | undefined;
      if (!player) {
        setData((d) => ({ ...d, loading: false }));
        return;
      }

      const [
        { data: scores },
        { data: assessments },
        { data: feedback },
        { data: fees },
        { data: payments },
        { data: attendance },
        { data: announcements },
        { data: goals },
        { data: sessions },
      ] = await Promise.all([
        supabase.from("player_scores").select("*, assessment:assessment_templates(*)").eq("player_id", player.id).order("date", { ascending: false }),
        supabase.from("assessment_templates").select("*"),
        supabase.from("game_feedback").select("*").eq("player_id", player.id).order("date", { ascending: false }),
        supabase.from("fees").select("*").eq("player_id", player.id).order("due_date", { ascending: false }),
        supabase.from("payments").select("*").eq("player_id", player.id).order("date", { ascending: false }),
        supabase.from("attendance").select("*").eq("player_id", player.id).order("date", { ascending: false }),
        supabase.from("announcements").select("*").order("date", { ascending: false }).limit(10),
        supabase.from("development_goals").select("*").eq("player_id", player.id).order("target_date"),
        player.team_id
          ? supabase.from("training_sessions").select("*").eq("team_id", player.team_id).gte("date", new Date().toISOString().split("T")[0]).order("date").limit(3)
          : Promise.resolve({ data: [] }),
      ]);

      setData({
        player,
        scores: (scores || []) as PlayerScore[],
        assessments: (assessments || []) as AssessmentTemplate[],
        feedback: (feedback || []) as GameFeedback[],
        fees: (fees || []) as Fee[],
        payments: (payments || []) as Payment[],
        attendance: (attendance || []) as AttendanceRecord[],
        announcements: (announcements || []) as Announcement[],
        goals: (goals || []) as DevelopmentGoal[],
        upcomingSessions: (sessions || []) as TrainingSession[],
        loading: false,
      });
    }

    load();
  }, []);

  return data;
}
