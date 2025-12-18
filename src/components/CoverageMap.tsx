import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// London borough boundaries GeoJSON (approximate centroids and simple polygons)
const LONDON_BOROUGHS_GEOJSON_URL = 'https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson';

interface CoverageMapProps {
  highlightedBorough?: string;
  mapboxToken: string;
}

const CoverageMap: React.FC<CoverageMapProps> = ({ highlightedBorough, mapboxToken }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [coveredBoroughs, setCoveredBoroughs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fetch covered boroughs from database
  useEffect(() => {
    const fetchCoverage = async () => {
      try {
        const { data, error } = await supabase
          .from('coverage_regions')
          .select('name')
          .eq('is_active', true);

        if (error) throw error;

        // Map database region names to match GeoJSON names
        const boroughNames = data?.map(r => r.name) || [];
        setCoveredBoroughs(boroughNames);
      } catch (error) {
        console.error('Error fetching coverage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoverage();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || loading) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-0.1276, 51.5074], // London center
      zoom: 9.5,
      pitch: 0,
      bearing: 0,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false }),
      'top-right'
    );

    map.current.on('load', async () => {
      setMapLoaded(true);

      try {
        // Fetch London boroughs GeoJSON
        const response = await fetch(LONDON_BOROUGHS_GEOJSON_URL);
        const geojson = await response.json();

        // Add the source
        map.current?.addSource('london-boroughs', {
          type: 'geojson',
          data: geojson,
        });

        // Add a layer for all boroughs (uncovered - gray)
        map.current?.addLayer({
          id: 'boroughs-uncovered',
          type: 'fill',
          source: 'london-boroughs',
          paint: {
            'fill-color': '#e5e7eb',
            'fill-opacity': 0.6,
          },
        });

        // Add covered boroughs layer
        map.current?.addLayer({
          id: 'boroughs-covered',
          type: 'fill',
          source: 'london-boroughs',
          paint: {
            'fill-color': '#22c55e',
            'fill-opacity': 0.5,
          },
          filter: ['in', ['get', 'name'], ['literal', coveredBoroughs]],
        });

        // Add highlighted borough layer
        map.current?.addLayer({
          id: 'borough-highlighted',
          type: 'fill',
          source: 'london-boroughs',
          paint: {
            'fill-color': '#16a34a',
            'fill-opacity': 0.8,
          },
          filter: ['==', ['get', 'name'], ''],
        });

        // Add borough borders
        map.current?.addLayer({
          id: 'boroughs-borders',
          type: 'line',
          source: 'london-boroughs',
          paint: {
            'line-color': '#6b7280',
            'line-width': 1,
          },
        });

        // Add covered borough borders with primary color
        map.current?.addLayer({
          id: 'boroughs-covered-borders',
          type: 'line',
          source: 'london-boroughs',
          paint: {
            'line-color': '#16a34a',
            'line-width': 2,
          },
          filter: ['in', ['get', 'name'], ['literal', coveredBoroughs]],
        });

        // Add labels for boroughs
        map.current?.addLayer({
          id: 'borough-labels',
          type: 'symbol',
          source: 'london-boroughs',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 10,
            'text-anchor': 'center',
          },
          paint: {
            'text-color': '#374151',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
          },
        });

        // Popup on hover
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        map.current?.on('mousemove', 'boroughs-covered', (e) => {
          if (!map.current || !e.features?.length) return;
          
          map.current.getCanvas().style.cursor = 'pointer';
          const name = e.features[0].properties?.name;
          
          popup
            .setLngLat(e.lngLat)
            .setHTML(`<div class="p-2 font-semibold text-green-700">✓ ${name}</div>`)
            .addTo(map.current);
        });

        map.current?.on('mousemove', 'boroughs-uncovered', (e) => {
          if (!map.current || !e.features?.length) return;
          
          const name = e.features[0].properties?.name;
          const isCovered = coveredBoroughs.includes(name);
          
          if (!isCovered) {
            map.current.getCanvas().style.cursor = 'default';
            popup
              .setLngLat(e.lngLat)
              .setHTML(`<div class="p-2 text-gray-500">${name} - Not covered</div>`)
              .addTo(map.current);
          }
        });

        map.current?.on('mouseleave', 'boroughs-covered', () => {
          if (!map.current) return;
          map.current.getCanvas().style.cursor = '';
          popup.remove();
        });

        map.current?.on('mouseleave', 'boroughs-uncovered', () => {
          if (!map.current) return;
          popup.remove();
        });

      } catch (error) {
        console.error('Error loading GeoJSON:', error);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, loading, coveredBoroughs]);

  // Update highlighted borough
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const filterValue = highlightedBorough || '';
    map.current.setFilter('borough-highlighted', ['==', ['get', 'name'], filterValue]);

    // Fly to highlighted borough if provided
    if (highlightedBorough && coveredBoroughs.includes(highlightedBorough)) {
      // For now, just keep the current view
    }
  }, [highlightedBorough, mapLoaded, coveredBoroughs]);

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-2xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
        <div className="text-xs font-semibold text-slate-700 mb-2">Coverage Areas</div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 rounded bg-green-500/60 border border-green-600"></div>
          <span className="text-slate-600">We Cover</span>
        </div>
        <div className="flex items-center gap-2 text-xs mt-1">
          <div className="w-4 h-4 rounded bg-gray-200 border border-gray-400"></div>
          <span className="text-slate-600">Not Covered</span>
        </div>
      </div>

      {/* Coverage count */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
        <div className="text-xs text-slate-500">Covering</div>
        <div className="text-lg font-bold text-primary">{coveredBoroughs.length} London Boroughs</div>
      </div>
    </div>
  );
};

export default CoverageMap;
