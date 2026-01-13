'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDuration, formatDateShort } from '@/lib/utils/pace';
import type { SeasonPR } from '@/types';

interface SeasonPRsProps {
  prs: SeasonPR[];
  year?: number;
}

const distanceLabels: Record<string, string> = {
  '1km': '1 km',
  '5km': '5 km',
  '10km': '10 km',
};

export function SeasonPRs({ prs, year = new Date().getFullYear() }: SeasonPRsProps) {
  const distances = ['1km', '5km', '10km'] as const;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Season PRs</CardTitle>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            {year}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {distances.map((distance) => {
            const pr = prs.find((p) => p.distance === distance);
            return (
              <div
                key={distance}
                className="text-center p-4 rounded-lg bg-muted/50 space-y-2"
              >
                <p className="text-sm text-muted-foreground font-medium">
                  {distanceLabels[distance]}
                </p>
                {pr ? (
                  <>
                    <p className="text-2xl font-bold text-gradient">
                      {formatDuration(pr.timeSeconds)}
                    </p>
                    <Link
                      href={`/activity/${pr.activityId}`}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors block"
                    >
                      {formatDateShort(pr.achievedAt)}
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-muted-foreground">--:--</p>
                    <p className="text-xs text-muted-foreground">No PR yet</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
