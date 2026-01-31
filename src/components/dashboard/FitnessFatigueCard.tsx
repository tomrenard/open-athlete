"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyLoadPoint } from "@/actions/training-load.actions";

interface FitnessFatigueCardProps {
  latest: DailyLoadPoint;
}

function getFormInterpretation(tsb: number): string {
  if (tsb > 15) return "Very fresh — good for a key effort";
  if (tsb > 5) return "Fresh";
  if (tsb >= -5) return "Neutral";
  if (tsb >= -15) return "Tired — recovery recommended";
  return "Very fatigued — prioritize rest";
}

export function FitnessFatigueCard({ latest }: FitnessFatigueCardProps) {
  const formLabel = getFormInterpretation(latest.tsb);
  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">
          Fitness & fatigue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Fitness (CTL)</p>
            <p className="text-xl font-bold tabular-nums">{latest.ctl}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fatigue (ATL)</p>
            <p className="text-xl font-bold tabular-nums">{latest.atl}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Form (TSB)</p>
            <p className="text-xl font-bold tabular-nums">
              {latest.tsb >= 0 ? `+${latest.tsb}` : latest.tsb}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Form: {latest.tsb >= 0 ? `+${latest.tsb}` : latest.tsb} — {formLabel}
        </p>
      </CardContent>
    </Card>
  );
}
