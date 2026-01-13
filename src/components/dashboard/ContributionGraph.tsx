'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WeeklyActivity } from '@/types';

interface ContributionGraphProps {
  data: WeeklyActivity[];
  weeks?: number;
}

function getIntensityLevel(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const intensityColors = [
  'bg-muted',
  'bg-electric-blue-200 dark:bg-electric-blue-500/30',
  'bg-electric-blue-300 dark:bg-electric-blue-500/50',
  'bg-electric-blue-400 dark:bg-electric-blue-500/70',
  'bg-electric-blue-500 dark:bg-electric-blue-500',
];

export function ContributionGraph({ data, weeks = 52 }: ContributionGraphProps) {
  const { grid, totalActivities, monthLabels } = useMemo(() => {
    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const totalActivities = data.reduce((sum, d) => sum + d.count, 0);

    const grid: { date: string; count: number; level: number }[][] = [];
    const lastNWeeks = data.slice(-weeks);

    for (let week = 0; week < weeks; week++) {
      const weekData = lastNWeeks[week];
      grid.push([
        {
          date: weekData?.date || '',
          count: weekData?.count || 0,
          level: getIntensityLevel(weekData?.count || 0, maxCount),
        },
      ]);
    }

    const monthLabels: { label: string; position: number }[] = [];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    let currentMonth = -1;

    grid.forEach((week, index) => {
      if (week[0]?.date) {
        const date = new Date(week[0].date);
        const month = date.getMonth();
        if (month !== currentMonth) {
          currentMonth = month;
          monthLabels.push({ label: months[month], position: index });
        }
      }
    });

    return { grid, totalActivities, maxCount, monthLabels };
  }, [data, weeks]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Weekly Consistency</CardTitle>
          <span className="text-sm text-muted-foreground">
            {totalActivities} activities this year
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex text-xs text-muted-foreground mb-1">
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${(m.position / weeks) * 100}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex gap-[3px] min-w-max">
              {grid.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIdx) => (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className={`w-3 h-3 rounded-sm ${intensityColors[day.level]} transition-colors`}
                      title={
                        day.date
                          ? `${day.count} activities - Week of ${new Date(day.date).toLocaleDateString()}`
                          : 'No data'
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            {intensityColors.map((color, idx) => (
              <div key={idx} className={`w-3 h-3 rounded-sm ${color}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
