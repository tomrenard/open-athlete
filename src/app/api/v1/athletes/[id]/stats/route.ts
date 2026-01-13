import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    const { data: activities, error } = await supabase
      .from('activities')
      .select('distance_meters, elapsed_time_seconds, elevation_gain_meters')
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stats = {
      totalActivities: activities?.length || 0,
      totalDistanceMeters: activities?.reduce(
        (sum, a) => sum + Number(a.distance_meters),
        0
      ) || 0,
      totalDurationSeconds: activities?.reduce(
        (sum, a) => sum + a.elapsed_time_seconds,
        0
      ) || 0,
      totalElevationGainMeters: activities?.reduce(
        (sum, a) => sum + (Number(a.elevation_gain_meters) || 0),
        0
      ) || 0,
    };

    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const { data: prsData } = await supabase.rpc('get_season_prs', {
      target_user_id: userId,
      year_start: yearStart,
    });

    const seasonPrs =
      prsData?.map(
        (row: {
          distance: string;
          time_seconds: number;
          activity_id: string;
          activity_name: string;
          achieved_at: string;
        }) => ({
          distance: row.distance,
          timeSeconds: row.time_seconds,
          activityId: row.activity_id,
          activityName: row.activity_name,
          achievedAt: row.achieved_at,
        })
      ) || [];

    return NextResponse.json({
      stats,
      seasonPrs,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
