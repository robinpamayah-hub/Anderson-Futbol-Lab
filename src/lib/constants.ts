import type { AgeGroup, Position, AssessmentCategory } from "./types";

export const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: "U8", label: "Under 8" },
  { value: "U10", label: "Under 10" },
  { value: "U12", label: "Under 12" },
  { value: "U14", label: "Under 14" },
  { value: "U16", label: "Under 16" },
  { value: "U18", label: "Under 18" },
  { value: "Senior", label: "Senior" },
];

export const POSITIONS: { value: Position; label: string }[] = [
  { value: "GK", label: "Goalkeeper" },
  { value: "DEF", label: "Defender" },
  { value: "MID", label: "Midfielder" },
  { value: "FWD", label: "Forward" },
];

export const ASSESSMENT_CATEGORIES: { value: AssessmentCategory; label: string }[] = [
  { value: "fitness", label: "Fitness" },
  { value: "technical", label: "Technical" },
  { value: "tactical", label: "Tactical" },
];

export const FEE_CATEGORIES = [
  { value: "registration", label: "Registration" },
  { value: "equipment", label: "Equipment" },
  { value: "tournament", label: "Tournament" },
  { value: "uniform", label: "Uniform" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "card", label: "Card" },
  { value: "transfer", label: "Transfer" },
  { value: "other", label: "Other" },
] as const;

export const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
] as const;

export const SESSION_TYPES = [
  { value: "training", label: "Training" },
  { value: "game", label: "Game" },
  { value: "tournament", label: "Tournament" },
  { value: "tryout", label: "Tryout" },
] as const;

export const DEFAULT_ASSESSMENTS = [
  // Fitness
  { name: "Beep Test", category: "fitness" as const, unit: "level", higher_is_better: true, position_specific: false, applicable_positions: null },
  { name: "40m Sprint", category: "fitness" as const, unit: "seconds", higher_is_better: false, position_specific: false, applicable_positions: null },
  { name: "5-10-5 Shuttle", category: "fitness" as const, unit: "seconds", higher_is_better: false, position_specific: false, applicable_positions: null },
  { name: "Vertical Jump", category: "fitness" as const, unit: "cm", higher_is_better: true, position_specific: false, applicable_positions: null },
  { name: "Yo-Yo IR1", category: "fitness" as const, unit: "meters", higher_is_better: true, position_specific: false, applicable_positions: null },
  // Technical
  { name: "Passing Accuracy", category: "technical" as const, unit: "score/10", higher_is_better: true, position_specific: false, applicable_positions: null },
  { name: "Shooting Accuracy", category: "technical" as const, unit: "score/10", higher_is_better: true, position_specific: true, applicable_positions: ["FWD", "MID"] as const },
  { name: "Dribbling", category: "technical" as const, unit: "score/10", higher_is_better: true, position_specific: false, applicable_positions: null },
  { name: "First Touch", category: "technical" as const, unit: "score/10", higher_is_better: true, position_specific: false, applicable_positions: null },
  { name: "Heading", category: "technical" as const, unit: "score/10", higher_is_better: true, position_specific: false, applicable_positions: null },
  { name: "Distribution (GK)", category: "technical" as const, unit: "score/10", higher_is_better: true, position_specific: true, applicable_positions: ["GK"] as const },
  { name: "Shot Stopping (GK)", category: "technical" as const, unit: "score/10", higher_is_better: true, position_specific: true, applicable_positions: ["GK"] as const },
  { name: "1v1 Defending", category: "technical" as const, unit: "score/10", higher_is_better: true, position_specific: true, applicable_positions: ["DEF"] as const },
  // Tactical
  { name: "Positioning", category: "tactical" as const, unit: "score/10", higher_is_better: true, position_specific: false, applicable_positions: null },
  { name: "Game Intelligence", category: "tactical" as const, unit: "score/10", higher_is_better: true, position_specific: false, applicable_positions: null },
  { name: "Communication", category: "tactical" as const, unit: "score/10", higher_is_better: true, position_specific: false, applicable_positions: null },
];

export const POSITION_COLORS: Record<Position, string> = {
  GK: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  DEF: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  MID: "bg-green-500/15 text-green-700 dark:text-green-400",
  FWD: "bg-red-500/15 text-red-700 dark:text-red-400",
};

export const AGE_GROUP_COLORS: Record<AgeGroup, string> = {
  U8: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  U10: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  U12: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  U14: "bg-green-500/15 text-green-700 dark:text-green-400",
  U16: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  U18: "bg-red-500/15 text-red-700 dark:text-red-400",
  Senior: "bg-navy/15 text-navy dark:text-gold",
};
