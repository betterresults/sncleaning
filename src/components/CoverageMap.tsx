import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// London borough boundaries GeoJSON
const LONDON_BOROUGHS_GEOJSON_URL = 'https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson';

// Essex county boundaries GeoJSON
const ESSEX_GEOJSON_URL = 'https://raw.githubusercontent.com/glynnbird/ukcountiesgeojson/master/essex.geojson';

interface CoverageMapProps {
  highlightedBorough?: string;
  mapboxToken: string;
}

const CoverageMap: React.FC<CoverageMapProps> = ({ highlightedBorough, mapboxToken }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [coveredBoroughs, setCoveredBoroughs] = useState<string[]>([]);
  const [essexCovered, setEssexCovered] = useState(false);
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

        // Separate London boroughs from Essex areas
        const londonBoroughs: string[] = [];
        let hasEssex = false;
        
        data?.forEach(r => {
          if (r.name.toLowerCase().includes('essex')) {
            hasEssex = true;
          } else {
            londonBoroughs.push(r.name);
          }
        });
        
        setCoveredBoroughs(londonBoroughs);
        setEssexCovered(hasEssex);
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
      center: [0.05, 51.55], // Shifted east to show Essex
      zoom: 8.5,
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
        // Fetch both GeoJSONs in parallel
        const [londonResponse, essexResponse] = await Promise.all([
          fetch(LONDON_BOROUGHS_GEOJSON_URL),
          fetch(ESSEX_GEOJSON_URL)
        ]);
        
        const londonGeojson = await londonResponse.json();
        const essexGeojson = await essexResponse.json();

        // Add London boroughs source
        map.current?.addSource('london-boroughs', {
          type: 'geojson',
          data: londonGeojson,
        });

        // Add Essex county source
        map.current?.addSource('essex-county', {
          type: 'geojson',
          data: essexGeojson,
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

        // Add Essex uncovered layer (gray)
        map.current?.addLayer({
          id: 'essex-uncovered',
          type: 'fill',
          source: 'essex-county',
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

        // Add Essex covered layer (if Essex is covered)
        if (essexCovered) {
          map.current?.addLayer({
            id: 'essex-covered',
            type: 'fill',
            source: 'essex-county',
            paint: {
              'fill-color': '#22c55e',
              'fill-opacity': 0.5,
            },
          });
        }

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

        // Add Essex borders
        map.current?.addLayer({
          id: 'essex-borders',
          type: 'line',
          source: 'essex-county',
          paint: {
            'line-color': essexCovered ? '#16a34a' : '#6b7280',
            'line-width': essexCovered ? 2 : 1,
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

        // Popup on hover for London
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

        // Hover for Essex
        if (essexCovered) {
          map.current?.on('mousemove', 'essex-covered', (e) => {
            if (!map.current) return;
            
            map.current.getCanvas().style.cursor = 'pointer';
            popup
              .setLngLat(e.lngLat)
              .setHTML(`<div class="p-2 font-semibold text-green-700">✓ Essex</div>`)
              .addTo(map.current);
          });

          map.current?.on('mouseleave', 'essex-covered', () => {
            if (!map.current) return;
            map.current.getCanvas().style.cursor = '';
            popup.remove();
          });
        } else {
          map.current?.on('mousemove', 'essex-uncovered', (e) => {
            if (!map.current) return;
            
            map.current.getCanvas().style.cursor = 'default';
            popup
              .setLngLat(e.lngLat)
              .setHTML(`<div class="p-2 text-gray-500">Essex - Not covered</div>`)
              .addTo(map.current);
          });

          map.current?.on('mouseleave', 'essex-uncovered', () => {
            if (!map.current) return;
            popup.remove();
          });
        }

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
  }, [mapboxToken, loading, coveredBoroughs, essexCovered]);

  // Update highlighted borough
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const filterValue = highlightedBorough || '';
    map.current.setFilter('borough-highlighted', ['==', ['get', 'name'], filterValue]);
  }, [highlightedBorough, mapLoaded, coveredBoroughs]);

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-2xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalAreas = coveredBoroughs.length + (essexCovered ? 1 : 0);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
        <div className="text-xs font-semibold text-slate-700 mb-2">Coverage Areas</div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 rounded bg-green-500/60 border border-green-600"></div>
          <span className="text-slate-600">Covered Areas</span>
        </div>
        <div className="flex items-center gap-2 text-xs mt-1">
          <div className="w-4 h-4 rounded bg-gray-200 border border-gray-400"></div>
          <span className="text-slate-600">Not Covered</span>
        </div>
      </div>

      {/* Coverage count */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
        <div className="text-xs text-slate-500">Covering</div>
        <div className="text-lg font-bold text-primary">{totalAreas} Areas</div>
        <div className="text-xs text-slate-500">{coveredBoroughs.length} London{essexCovered ? ' + Essex' : ''}</div>
      </div>
    </div>
  );
};

export default CoverageMap;
