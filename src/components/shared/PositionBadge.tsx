import { Badge } from "@/components/ui/badge";
import { POSITION_COLORS, POSITIONS } from "@/lib/constants";
import type { Position } from "@/lib/types";

export function PositionBadge({ position }: { position: Position }) {
  const label = POSITIONS.find((p) => p.value === position)?.label ?? position;
  return (
    <Badge variant="outline" className={POSITION_COLORS[position]}>
      {label}
    </Badge>
  );
}
