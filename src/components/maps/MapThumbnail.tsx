'use client';

import { useEffect, useRef, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { decodePolyline, calculateBounds } from '@/lib/utils/polyline';
import type { Coordinates } from '@/types';

interface MapThumbnailProps {
  polyline: string;
  className?: string;
}

export function MapThumbnail({ polyline, className = '' }: MapThumbnailProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const coordinates = useMemo(() => decodePolyline(polyline), [polyline]);
  const bounds = useMemo(() => calculateBounds(coordinates), [coordinates]);

  useEffect(() => {
    if (!mapRef.current || coordinates.length === 0) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;
      
      if (!isMounted || !mapRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const latLngs: [number, number][] = coordinates.map((c: Coordinates) => [c.lat, c.lng]);
      
      L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const boundsLatLng = L.latLngBounds(
        [bounds.sw.lat, bounds.sw.lng],
        [bounds.ne.lat, bounds.ne.lng]
      );

      map.fitBounds(boundsLatLng, {
        padding: [20, 20],
        animate: false,
      });

      L.circleMarker([latLngs[0][0], latLngs[0][1]], {
        radius: 5,
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);

      const lastPoint = latLngs[latLngs.length - 1];
      L.circleMarker([lastPoint[0], lastPoint[1]], {
        radius: 5,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, bounds]);

  if (coordinates.length === 0) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground text-sm">No route data</p>
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
}
