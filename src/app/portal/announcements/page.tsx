"use client";

import { usePlayerData } from "@/hooks/usePlayerData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Megaphone, AlertTriangle, Info } from "lucide-react";

export default function AnnouncementsPage() {
  const { announcements, loading } = usePlayerData();

  if (loading) return <div className="text-center text-muted-foreground p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Announcements</h1>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No announcements at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card
              key={a.id}
              className={
                a.priority === "urgent"
                  ? "border-red-500/30 bg-red-500/5"
                  : a.priority === "important"
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : ""
              }
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {a.priority === "urgent" ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : a.priority === "important" ? (
                      <Info className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Megaphone className="h-5 w-5 text-gold" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{a.title}</h3>
                      {a.priority !== "normal" && (
                        <Badge variant={a.priority === "urgent" ? "destructive" : "default"} className="text-xs capitalize">
                          {a.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{a.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(a.date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
