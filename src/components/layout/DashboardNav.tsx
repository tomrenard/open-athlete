"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Rss,
  Calendar,
  Upload,
  ChevronDown,
  Bell,
  Settings,
  User,
  LogOut,
  Trophy,
  Users,
  Target,
  Route,
  Sparkles,
} from "lucide-react";
import { signOut } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DashboardNavProps {
  user: { id: string } | null;
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  unreadCount: number;
}

const navLink = (href: string, label: string, icon: React.ReactNode) => ({
  href,
  label,
  icon,
});

const primaryLinks = [
  navLink("/dashboard", "Dashboard", <LayoutDashboard className="size-4" />),
  navLink("/feed", "Feed", <Rss className="size-4" />),
  navLink("/log", "Training Log", <Calendar className="size-4" />),
  navLink("/upload", "Upload", <Upload className="size-4" />),
];

const moreLinks = [
  navLink("/clubs", "Clubs", <Users className="size-4" />),
  navLink("/challenges", "Challenges", <Trophy className="size-4" />),
  navLink("/segments", "Segments", <Target className="size-4" />),
  navLink("/year-in-review", "Year in Review", <Sparkles className="size-4" />),
  navLink("/routes", "Routes", <Route className="size-4" />),
];

export function DashboardNav({
  user,
  profile,
  unreadCount,
}: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-foreground hover:opacity-90"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-4" />
          </div>
          <span className="font-semibold">OpenAthlete</span>
        </Link>

        <nav className="flex items-center gap-1">
          {primaryLinks.map(({ href, label, icon }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  pathname === href && "text-foreground"
                )}
              >
                {icon}
                <span className="ml-2 hidden sm:inline">{label}</span>
              </Button>
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                More
                <ChevronDown className="ml-1 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {moreLinks.map(({ href, label, icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href} className="flex items-center gap-2">
                    {icon}
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/notifications" className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="size-5" />
            </Button>
          </Link>
          {user && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full p-0"
                >
                  <Avatar className="size-8">
                    <AvatarImage
                      src={profile.avatar_url ?? undefined}
                      alt={profile.username}
                    />
                    <AvatarFallback className="bg-muted text-sm">
                      {(profile.display_name ?? profile.username)
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/athlete/${profile.username}`}
                    className="flex items-center gap-2"
                  >
                    <User className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    signOut();
                  }}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
