import * as polylineLib from '@mapbox/polyline';
import type { Coordinates } from '@/types';

export function encodePolyline(coordinates: Coordinates[]): string {
  if (coordinates.length === 0) return '';
  const points: [number, number][] = coordinates.map((c) => [c.lat, c.lng]);
  return polylineLib.encode(points);
}

export function decodePolyline(encoded: string): Coordinates[] {
  if (!encoded) return [];
  const decoded = polylineLib.decode(encoded) as [number, number][];
  return decoded.map(([lat, lng]) => ({ lat, lng }));
}

export function calculateBounds(coordinates: Coordinates[]): {
  sw: Coordinates;
  ne: Coordinates;
} {
  if (coordinates.length === 0) {
    return {
      sw: { lat: 0, lng: 0 },
      ne: { lat: 0, lng: 0 },
    };
  }

  let minLat = coordinates[0].lat;
  let maxLat = coordinates[0].lat;
  let minLng = coordinates[0].lng;
  let maxLng = coordinates[0].lng;

  for (const coord of coordinates) {
    if (coord.lat < minLat) minLat = coord.lat;
    if (coord.lat > maxLat) maxLat = coord.lat;
    if (coord.lng < minLng) minLng = coord.lng;
    if (coord.lng > maxLng) maxLng = coord.lng;
  }

  return {
    sw: { lat: minLat, lng: minLng },
    ne: { lat: maxLat, lng: maxLng },
  };
}

export function simplifyPolyline(
  coordinates: Coordinates[],
  tolerance: number = 0.00001
): Coordinates[] {
  if (coordinates.length <= 2) return coordinates;

  const result: Coordinates[] = [coordinates[0]];
  let prev = coordinates[0];

  for (let i = 1; i < coordinates.length - 1; i++) {
    const curr = coordinates[i];
    const dist = Math.sqrt(
      Math.pow(curr.lat - prev.lat, 2) + Math.pow(curr.lng - prev.lng, 2)
    );
    if (dist >= tolerance) {
      result.push(curr);
      prev = curr;
    }
  }

  result.push(coordinates[coordinates.length - 1]);
  return result;
}
