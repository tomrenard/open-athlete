"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  formatDistance,
  formatDuration,
  formatDateShort,
} from "@/lib/utils/pace";
import type { Activity, ActivityType } from "@/types";

interface ActivityWithSerializedDates
  extends Omit<Activity, "startedAt" | "createdAt" | "updatedAt"> {
  startedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface WeekGroup {
  weekKey: string;
  activities: ActivityWithSerializedDates[];
}

interface TrainingLogViewProps {
  initialActivities: ActivityWithSerializedDates[] | Activity[];
  initialWeekGroups?: {
    weekKey: string;
    activities: ActivityWithSerializedDates[];
  }[];
}

const activityTypeLabels: Record<ActivityType, string> = {
  run: "Run",
  ride: "Ride",
  swim: "Swim",
};

function getWeekKey(date: Date | string): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(weekKey: string): string {
  const d = new Date(weekKey);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return `${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function TrainingLogView({
  initialActivities,
  initialWeekGroups,
}: TrainingLogViewProps) {
  const [sportFilter, setSportFilter] = useState<ActivityType | "all">("all");

  const weekGroups = useMemo(() => {
    if (initialWeekGroups && initialWeekGroups.length > 0) {
      return initialWeekGroups.map((g) => ({
        weekKey: g.weekKey,
        activities: g.activities as ActivityWithSerializedDates[],
      }));
    }
    const groups = new Map<string, ActivityWithSerializedDates[]>();
    const activities = initialActivities as ActivityWithSerializedDates[];
    for (const activity of activities) {
      const weekKey = getWeekKey(activity.startedAt);
      if (!groups.has(weekKey)) {
        groups.set(weekKey, []);
      }
      groups.get(weekKey)!.push(activity);
    }
    return Array.from(groups.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([weekKey, activities]) => ({ weekKey, activities }));
  }, [initialActivities, initialWeekGroups]);

  const filteredGroups = useMemo(() => {
    if (sportFilter === "all") return weekGroups;
    return weekGroups
      .map((g) => ({
        ...g,
        activities: g.activities.filter((a) => a.type === sportFilter),
      }))
      .filter((g) => g.activities.length > 0);
  }, [weekGroups, sportFilter]);

  if (initialActivities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No activities in the last 12 weeks. Upload an activity to see your log.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center mr-2">
          Sport:
        </span>
        {(["all", "run", "ride", "swim"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSportFilter(type)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              sportFilter === type
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {type === "all" ? "All" : activityTypeLabels[type]}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {filteredGroups.map(({ weekKey, activities }) => (
          <div key={weekKey}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              {formatWeekLabel(weekKey)}
            </h3>
            <ul className="space-y-2">
              {activities.map((activity) => (
                <li key={activity.id}>
                  <Link
                    href={`/activity/${activity.id}`}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-accent text-accent-foreground"
                      >
                        {activityTypeLabels[activity.type]}
                      </Badge>
                      <span className="truncate group-hover:text-primary font-medium">
                        {activity.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
                      <span>{formatDateShort(activity.startedAt)}</span>
                      <span className="font-medium text-foreground">
                        {formatDistance(activity.distanceMeters)}
                      </span>
                      <span>
                        {formatDuration(
                          activity.movingTimeSeconds ||
                            activity.elapsedTimeSeconds
                        )}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
