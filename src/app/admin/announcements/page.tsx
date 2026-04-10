export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Plus, Megaphone, AlertTriangle, Info } from "lucide-react";
import type { Announcement, Team } from "@/lib/types";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", body: "", priority: "normal" as Announcement["priority"], target_team_ids: [] as string[],
  });

  const supabase = createClient();

  async function loadData() {
    const [{ data: a }, { data: t }] = await Promise.all([
      supabase.from("announcements").select("*").order("date", { ascending: false }),
      supabase.from("teams").select("*").order("name"),
    ]);
    setAnnouncements((a || []) as Announcement[]);
    setTeams((t || []) as Team[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("announcements").insert({
      title: form.title,
      body: form.body,
      priority: form.priority,
      target_team_ids: form.target_team_ids,
      created_by: user?.id,
    });
    if (!error) {
      setDialogOpen(false);
      setForm({ title: "", body: "", priority: "normal", target_team_ids: [] });
      loadData();
    }
  }

  const priorityIcon = (p: string) => {
    if (p === "urgent") return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (p === "important") return <Info className="h-4 w-4 text-yellow-500" />;
    return <Megaphone className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-navy hover:bg-navy-light text-gold" />}>
            <Plus className="h-4 w-4 mr-2" /> New Announcement
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Message</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} required /></div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: (v ?? "") as Announcement["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-navy hover:bg-navy-light text-gold">Post Announcement</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground p-8">Loading...</div>
      ) : announcements.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No announcements yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className={a.priority === "urgent" ? "border-red-500/30" : a.priority === "important" ? "border-yellow-500/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {priorityIcon(a.priority)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{a.title}</h3>
                      {a.priority !== "normal" && (
                        <Badge variant={a.priority === "urgent" ? "destructive" : "default"} className="text-xs capitalize">{a.priority}</Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1">{a.body}</p>
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
