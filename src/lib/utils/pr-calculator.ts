import type { GpsPoint } from '@/types';

interface DistancePR {
  distance: number;
  timeSeconds: number | null;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateBestEfforts(
  gpsPoints: GpsPoint[],
  targetDistances: number[] = [1000, 5000, 10000]
): Map<number, number | null> {
  const results = new Map<number, number | null>();

  if (gpsPoints.length < 2) {
    targetDistances.forEach((d) => results.set(d, null));
    return results;
  }

  const sortedPoints = [...gpsPoints].sort((a, b) => a.sequence - b.sequence);

  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < sortedPoints.length; i++) {
    const prev = sortedPoints[i - 1];
    const curr = sortedPoints[i];
    const segmentDist = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    cumulativeDistances.push(cumulativeDistances[i - 1] + segmentDist);
  }

  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];

  for (const targetDistance of targetDistances) {
    if (totalDistance < targetDistance) {
      results.set(targetDistance, null);
      continue;
    }

    let bestTime: number | null = null;
    let startIdx = 0;

    for (let endIdx = 1; endIdx < sortedPoints.length; endIdx++) {
      while (
        startIdx < endIdx &&
        cumulativeDistances[endIdx] - cumulativeDistances[startIdx] > targetDistance
      ) {
        startIdx++;
      }

      const windowDistance = cumulativeDistances[endIdx] - cumulativeDistances[startIdx];
      if (windowDistance >= targetDistance) {
        const startTime = new Date(sortedPoints[startIdx].timestamp).getTime();
        const endTime = new Date(sortedPoints[endIdx].timestamp).getTime();
        const timeDiff = (endTime - startTime) / 1000;

        if (timeDiff > 0 && (bestTime === null || timeDiff < bestTime)) {
          bestTime = timeDiff;
        }
      }
    }

    results.set(targetDistance, bestTime ? Math.round(bestTime) : null);
  }

  return results;
}

export function calculateActivityPRs(gpsPoints: GpsPoint[]): DistancePR[] {
  const distances = [1000, 5000, 10000];
  const bestEfforts = calculateBestEfforts(gpsPoints, distances);

  return distances.map((distance) => ({
    distance,
    timeSeconds: bestEfforts.get(distance) ?? null,
  }));
}
