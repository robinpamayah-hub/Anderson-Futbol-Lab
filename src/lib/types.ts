// === Core Types ===

export type UserRole = "admin" | "parent";

export type AgeGroup = "U8" | "U10" | "U12" | "U14" | "U16" | "U18" | "Senior";

export type Position = "GK" | "DEF" | "MID" | "FWD";

export type FeeStatus = "paid" | "partial" | "outstanding" | "overdue";

export type AssessmentCategory = "fitness" | "technical" | "tactical";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

// === Entities ===

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  age_group: AgeGroup;
  season: string;
  coach_name: string;
  assistant_coach_name: string | null;
  max_roster_size: number;
  created_at: string;
}

export interface Player {
  id: string;
  parent_id: string;
  team_id: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age_group: AgeGroup;
  position: Position;
  secondary_position: Position | null;
  bio: string;
  photo_url: string | null;
  join_date: string;
  is_active: boolean;
  created_at: string;
  // Joined fields
  team?: Team;
  parent?: Profile;
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  category: AssessmentCategory;
  unit: string;
  higher_is_better: boolean;
  position_specific: boolean;
  applicable_positions: Position[] | null;
  created_at: string;
}

export interface PlayerScore {
  id: string;
  player_id: string;
  assessment_id: string;
  value: number;
  date: string;
  notes: string;
  recorded_by: string;
  created_at: string;
  // Joined fields
  assessment?: AssessmentTemplate;
  player?: Player;
}

export interface GameFeedback {
  id: string;
  player_id: string;
  date: string;
  opponent: string;
  result: string | null;
  minutes_played: number;
  position_played: Position;
  rating: number;
  strengths: string;
  areas_to_improve: string;
  coach_notes: string;
  recorded_by: string;
  created_at: string;
  // Joined fields
  player?: Player;
}

export interface Fee {
  id: string;
  player_id: string;
  description: string;
  amount: number;
  due_date: string;
  season: string;
  category: "registration" | "equipment" | "tournament" | "uniform" | "training" | "other";
  status: FeeStatus;
  created_at: string;
  // Joined fields
  player?: Player;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  fee_id: string;
  player_id: string;
  amount: number;
  date: string;
  method: "cash" | "check" | "card" | "transfer" | "other";
  reference: string;
  notes: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  player_id: string;
  session_id: string;
  date: string;
  status: AttendanceStatus;
  notes: string;
  created_at: string;
  // Joined fields
  player?: Player;
}

export interface TrainingSession {
  id: string;
  team_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  type: "training" | "game" | "tournament" | "tryout";
  plan: string;
  focus: string[];
  created_at: string;
  // Joined fields
  team?: Team;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  target_team_ids: string[];
  priority: "normal" | "important" | "urgent";
  created_by: string;
  created_at: string;
}

export interface DevelopmentGoal {
  id: string;
  player_id: string;
  category: AssessmentCategory;
  description: string;
  target_date: string;
  is_achieved: boolean;
  notes: string;
  created_at: string;
}

// === Computed / View Types ===

export interface FinancialSummary {
  totalPlayers: number;
  activeTeams: number;
  feesCollectedThisMonth: number;
  feesOutstanding: number;
  totalFeesThisSeason: number;
  collectionRate: number;
}

export interface PlayerScoreWithTrend {
  assessment: AssessmentTemplate;
  latestScore: number;
  previousScore: number | null;
  trend: "up" | "down" | "same";
  trendPercent: number;
}
