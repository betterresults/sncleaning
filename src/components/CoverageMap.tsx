import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// London borough boundaries GeoJSON (approximate centroids and simple polygons)
const LONDON_BOROUGHS_GEOJSON_URL = 'https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson';

// Essex area coordinates (approximate centers)
const ESSEX_AREAS: { name: string; coordinates: [number, number] }[] = [
  { name: 'Basildon', coordinates: [0.4548, 51.5761] },
  { name: 'Benfleet', coordinates: [0.5614, 51.5461] },
  { name: 'Brentwood', coordinates: [0.3057, 51.6214] },
  { name: 'Canvey Island', coordinates: [0.5821, 51.5214] },
  { name: 'Chelmsford', coordinates: [0.4798, 51.7356] },
  { name: 'Leigh-on-Sea', coordinates: [0.6543, 51.5428] },
  { name: 'Rayleigh', coordinates: [0.6048, 51.5861] },
  { name: 'Southend-on-Sea', coordinates: [0.7108, 51.5459] },
  { name: 'Romford / Thurrock', coordinates: [0.3684, 51.5168] },
];

interface CoverageMapProps {
  highlightedBorough?: string;
  mapboxToken: string;
}

const CoverageMap: React.FC<CoverageMapProps> = ({ highlightedBorough, mapboxToken }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [coveredBoroughs, setCoveredBoroughs] = useState<string[]>([]);
  const [coveredEssexAreas, setCoveredEssexAreas] = useState<string[]>([]);
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
        const essexAreas: string[] = [];
        
        data?.forEach(r => {
          if (r.name.toLowerCase().includes('essex')) {
            essexAreas.push(r.name);
          } else {
            londonBoroughs.push(r.name);
          }
        });
        
        setCoveredBoroughs(londonBoroughs);
        setCoveredEssexAreas(essexAreas);
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
      zoom: 8.5, // Zoomed out more
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

        // Add Essex area markers
        ESSEX_AREAS.forEach(area => {
          const isAreaCovered = coveredEssexAreas.some(name => 
            name.toLowerCase().includes(area.name.toLowerCase().split(' ')[0])
          );
          
          if (isAreaCovered && map.current) {
            // Create marker element
            const el = document.createElement('div');
            el.className = 'essex-marker';
            el.style.width = '24px';
            el.style.height = '24px';
            el.style.backgroundColor = '#22c55e';
            el.style.border = '3px solid #16a34a';
            el.style.borderRadius = '50%';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

            const marker = new mapboxgl.Marker(el)
              .setLngLat(area.coordinates)
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`<div class="p-2 font-semibold text-green-700">✓ Essex - ${area.name}</div>`)
              )
              .addTo(map.current);
          }
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
  }, [mapboxToken, loading, coveredBoroughs, coveredEssexAreas]);

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

  const totalAreas = coveredBoroughs.length + coveredEssexAreas.length;

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
        <div className="text-xs font-semibold text-slate-700 mb-2">Coverage Areas</div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 rounded bg-green-500/60 border border-green-600"></div>
          <span className="text-slate-600">London Boroughs</span>
        </div>
        <div className="flex items-center gap-2 text-xs mt-1">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600"></div>
          <span className="text-slate-600">Essex Areas</span>
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
        <div className="text-xs text-slate-500">{coveredBoroughs.length} London + {coveredEssexAreas.length} Essex</div>
      </div>
    </div>
  );
};

export default CoverageMap;
