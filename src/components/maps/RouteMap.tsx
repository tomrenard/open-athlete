'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { decodePolyline, calculateBounds } from '@/lib/utils/polyline';
import { Button } from '@/components/ui/button';
import type { Coordinates } from '@/types';

interface RouteMapProps {
  polyline: string;
  className?: string;
  showFullscreenButton?: boolean;
}

export function RouteMap({ polyline, className = '', showFullscreenButton = true }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        zoomControl: true,
        attributionControl: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const latLngs: [number, number][] = coordinates.map((c: Coordinates) => [c.lat, c.lng]);

      L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const boundsLatLng = L.latLngBounds(
        [bounds.sw.lat, bounds.sw.lng],
        [bounds.ne.lat, bounds.ne.lng]
      );

      map.fitBounds(boundsLatLng, {
        padding: [40, 40],
        animate: false,
      });

      const startIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width: 24px; height: 24px; background: #22c55e; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const endIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width: 24px; height: 24px; background: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([latLngs[0][0], latLngs[0][1]], { icon: startIcon })
        .addTo(map)
        .bindPopup('Start');

      const lastPoint = latLngs[latLngs.length - 1];
      L.marker([lastPoint[0], lastPoint[1]], { icon: endIcon })
        .addTo(map)
        .bindPopup('Finish');
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

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  function toggleFullscreen() {
    if (!mapRef.current) return;

    if (!isFullscreen) {
      if (mapRef.current.requestFullscreen) {
        mapRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (coordinates.length === 0) {
    return (
      <div className={`bg-muted rounded-xl flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground">No route data available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        className={`w-full h-full rounded-xl overflow-hidden ${isFullscreen ? 'rounded-none' : ''}`}
      />
      {showFullscreenButton && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-3 right-3 z-[1000] btn-touch glass"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          )}
        </Button>
      )}
    </div>
  );
}
