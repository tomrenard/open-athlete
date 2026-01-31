"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createGoal,
  deleteGoal,
  type GoalWithProgress,
  type GoalType,
  type GoalPeriod,
} from "@/actions/goals.actions";

interface GoalsCardProps {
  initialGoals: GoalWithProgress[];
}

const goalTypeLabels: Record<GoalType, string> = {
  distance: "Distance (km)",
  time: "Time (hours)",
  elevation: "Elevation (m)",
  activities: "Activities",
};

const goalPeriodLabels: Record<GoalPeriod, string> = {
  week: "Week",
  month: "Month",
  year: "Year",
};

function formatPeriodStart(period: GoalPeriod, periodStart: Date): string {
  const d = new Date(periodStart);
  if (period === "week") {
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    return `${d.toLocaleDateString("en-US", {
      month: "short",
    })} ${d.getDate()} – ${end.getDate()}`;
  }
  if (period === "month") {
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return d.getFullYear().toString();
}

export function GoalsCard({ initialGoals }: GoalsCardProps) {
  const [goals, setGoals] = useState(initialGoals);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<GoalType>("distance");
  const [period, setPeriod] = useState<GoalPeriod>("month");
  const [targetValue, setTargetValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function getCurrentPeriodStart(p: GoalPeriod): Date {
    const now = new Date();
    if (p === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      return d;
    }
    if (p === "month") {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return new Date(now.getFullYear(), 0, 1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(targetValue);
    if (Number.isNaN(value) || value <= 0) {
      setError("Enter a valid target");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createGoal(
        type,
        period,
        value,
        getCurrentPeriodStart(period)
      );
      if (result.success) {
        setTargetValue("");
        setShowForm(false);
        setGoals((prev) => {
          const newGoal: GoalWithProgress = {
            id: "temp",
            userId: "",
            type,
            period,
            targetValue: value,
            periodStart: getCurrentPeriodStart(period),
            createdAt: new Date(),
            currentValue: 0,
            unit:
              type === "distance"
                ? "km"
                : type === "time"
                ? "hrs"
                : type === "elevation"
                ? "m"
                : "",
          };
          return [newGoal, ...prev];
        });
      } else {
        setError(result.error ?? "Failed to create goal");
      }
    });
  }

  function handleDelete(goalId: string) {
    startTransition(async () => {
      await deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    });
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Goals</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          disabled={isPending}
        >
          {showForm ? "Cancel" : "Add goal"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-3 p-4 rounded-lg bg-muted/30"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="goal-type">Type</Label>
                <select
                  id="goal-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as GoalType)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {(Object.keys(goalTypeLabels) as GoalType[]).map((t) => (
                    <option key={t} value={t}>
                      {goalTypeLabels[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="goal-period">Period</Label>
                <select
                  id="goal-period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {(Object.keys(goalPeriodLabels) as GoalPeriod[]).map((p) => (
                    <option key={p} value={p}>
                      {goalPeriodLabels[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="goal-target">Target</Label>
              <Input
                id="goal-target"
                type="number"
                min="0.01"
                step="0.01"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={type === "activities" ? "e.g. 10" : "e.g. 100"}
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "..." : "Save goal"}
            </Button>
          </form>
        )}

        {goals.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground">
            No goals yet. Add a goal to track your progress.
          </p>
        ) : (
          <ul className="space-y-3">
            {goals.map((goal) => {
              const pct =
                goal.targetValue > 0
                  ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
                  : 0;
              return (
                <li
                  key={goal.id}
                  className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {goalTypeLabels[goal.type]} ·{" "}
                      {goalPeriodLabels[goal.period]} ·{" "}
                      {formatPeriodStart(goal.period, goal.periodStart)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive h-8 px-2"
                      onClick={() => handleDelete(goal.id)}
                      disabled={isPending}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="font-bold">
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </span>
                    <span className="text-muted-foreground">
                      ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
