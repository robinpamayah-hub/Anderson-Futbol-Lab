import { Badge } from "@/components/ui/badge";
import { AGE_GROUP_COLORS } from "@/lib/constants";
import type { AgeGroup } from "@/lib/types";

export function AgeGroupBadge({ ageGroup }: { ageGroup: AgeGroup }) {
  return (
    <Badge variant="outline" className={AGE_GROUP_COLORS[ageGroup]}>
      {ageGroup}
    </Badge>
  );
}
