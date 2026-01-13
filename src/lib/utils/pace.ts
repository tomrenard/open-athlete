export function formatPace(secondsPerKm: number | undefined | null): string {
  if (!secondsPerKm || secondsPerKm <= 0) return '--:--';
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number | undefined | null): string {
  if (!seconds || seconds <= 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatDistance(meters: number | undefined | null): string {
  if (!meters || meters <= 0) return '0';
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(2)}km`;
  }
  return `${km.toFixed(1)}km`;
}

export function formatDistanceShort(meters: number | undefined | null): string {
  if (!meters || meters <= 0) return '0';
  const km = meters / 1000;
  return `${km.toFixed(1)}`;
}

export function formatElevation(meters: number | undefined | null): string {
  if (meters === undefined || meters === null) return '--';
  return `${Math.round(meters)}m`;
}

export function formatSpeed(kmh: number | undefined | null): string {
  if (!kmh || kmh <= 0) return '0';
  return `${kmh.toFixed(1)} km/h`;
}

export function formatHeartRate(bpm: number | undefined | null): string {
  if (!bpm || bpm <= 0) return '--';
  return `${Math.round(bpm)} bpm`;
}

export function formatCalories(cal: number | undefined | null): string {
  if (!cal || cal <= 0) return '--';
  return `${Math.round(cal)} kcal`;
}

export function calculatePace(distanceMeters: number, durationSeconds: number): number {
  if (distanceMeters <= 0 || durationSeconds <= 0) return 0;
  return (durationSeconds / distanceMeters) * 1000;
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateFull(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
