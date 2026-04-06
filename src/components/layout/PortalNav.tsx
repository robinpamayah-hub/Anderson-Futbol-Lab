"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, User, Trophy, ClipboardList, DollarSign, Megaphone, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/profile", label: "Profile", icon: User },
  { href: "/portal/scores", label: "Scores", icon: Trophy },
  { href: "/portal/feedback", label: "Feedback", icon: ClipboardList },
  { href: "/portal/fees", label: "Fees", icon: DollarSign },
  { href: "/portal/announcements", label: "News", icon: Megaphone },
];

export function PortalNav() {
  const pathname = usePathname();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/portal" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center border border-gold/40">
              <span className="text-xs font-bold text-gold">AF</span>
            </div>
            <span className="font-bold text-sm hidden sm:block">Anderson Futbol Lab</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
