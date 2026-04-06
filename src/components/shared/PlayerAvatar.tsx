import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface PlayerAvatarProps {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  className?: string;
}

export function PlayerAvatar({ firstName, lastName, photoUrl, className }: PlayerAvatarProps) {
  return (
    <Avatar className={className}>
      {photoUrl && <AvatarImage src={photoUrl} alt={`${firstName} ${lastName}`} />}
      <AvatarFallback className="bg-navy text-gold font-semibold">
        {getInitials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  );
}
