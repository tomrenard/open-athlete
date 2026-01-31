const CTL_TAU = 42;
const ATL_TAU = 7;
const CTL_FACTOR = 1 - Math.exp(-1 / CTL_TAU);
const ATL_FACTOR = 1 - Math.exp(-1 / ATL_TAU);

export interface DailyLoadPoint {
  date: string;
  load: number;
  ctl: number;
  atl: number;
  tsb: number;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function computeCtlAtlTsb(
  dailyLoads: { date: string; load: number }[],
  startDate: Date,
  endDate: Date
): DailyLoadPoint[] {
  const loadByDate = new Map<string, number>();
  for (const { date, load } of dailyLoads) {
    loadByDate.set(date, (loadByDate.get(date) ?? 0) + load);
  }

  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);
  const result: DailyLoadPoint[] = [];
  let ctl = 0;
  let atl = 0;

  const cur = new Date(parseDateKey(startKey));
  const end = parseDateKey(endKey);
  while (cur <= end) {
    const key = toDateKey(cur);
    const load = loadByDate.get(key) ?? 0;
    ctl = ctl + (load - ctl) * CTL_FACTOR;
    atl = atl + (load - atl) * ATL_FACTOR;
    const tsb = ctl - atl;
    result.push({
      date: key,
      load: Math.round(load * 100) / 100,
      ctl: Math.round(ctl * 100) / 100,
      atl: Math.round(atl * 100) / 100,
      tsb: Math.round(tsb * 100) / 100,
    });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}
