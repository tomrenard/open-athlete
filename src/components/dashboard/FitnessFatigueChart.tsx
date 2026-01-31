"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyLoadPoint } from "@/actions/training-load.actions";

interface FitnessFatigueChartProps {
  data: DailyLoadPoint[];
}

export function FitnessFatigueChart({ data }: FitnessFatigueChartProps) {
  const displayData = data.map((d) => ({
    ...d,
    dateShort: d.date.slice(5),
  }));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">
          Training stress (last 90 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateShort"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickFormatter={(v) => String(Math.round(v))}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number | undefined) =>
                  value != null
                    ? [String(Math.round(value * 100) / 100), undefined]
                    : [undefined, undefined]
                }
                labelFormatter={(label, payload) =>
                  payload?.[0]?.payload?.date ?? label
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => value}
              />
              <Line
                type="monotone"
                dataKey="ctl"
                name="Fitness (CTL)"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="atl"
                name="Fatigue (ATL)"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="tsb"
                name="Form (TSB)"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
