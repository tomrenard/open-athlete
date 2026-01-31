const DEFAULT_REST_HR = 60;
const DEFAULT_MAX_HR = 190;
const TRIMP_EXPONENT = 1.92;

export interface RelativeEffortInput {
  durationSeconds: number;
  avgHeartRate: number;
  maxHeartRate?: number | null;
  restHeartRate?: number | null;
}

export function computeRelativeEffort(input: RelativeEffortInput): number {
  const {
    durationSeconds,
    avgHeartRate,
    maxHeartRate = DEFAULT_MAX_HR,
    restHeartRate = DEFAULT_REST_HR,
  } = input;

  const max = maxHeartRate ?? DEFAULT_MAX_HR;
  const rest = restHeartRate ?? DEFAULT_REST_HR;
  const reserve = max - rest;
  if (reserve <= 0 || durationSeconds <= 0) return 0;

  const intensity = Math.max(0, Math.min(1, (avgHeartRate - rest) / reserve));
  const durationHours = durationSeconds / 3600;
  const trimp = durationHours * Math.pow(intensity, TRIMP_EXPONENT);
  return Math.round(trimp * 100) / 100;
}
