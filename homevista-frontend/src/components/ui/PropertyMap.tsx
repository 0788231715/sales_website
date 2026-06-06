"use client";

import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface PropertyMapProps {
  properties: any[];
  center?: [number, number];
  zoom?: number;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ properties, center = [ -1.9441, 30.0619 ], zoom = 13 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  useEffect(() => {
    // Ensure we are on the client side and the div exists
    if (typeof window === "undefined" || !mapRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = await import("leaflet");
      
      if (!isMounted || !mapRef.current) return;

      // Clean up previous map instance if it exists
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }

      // Initialize map
      const map = L.map(mapRef.current).setView(center, zoom);
      leafletMap.current = map;

      // Add Tile Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Define Icon
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      // Add Markers
      properties.forEach(property => {
        if (property.latitude && property.longitude) {
          const marker = L.marker([property.latitude, property.longitude], { icon }).addTo(map);
          
          const popupContent = `
            <div style="padding: 8px; min-width: 200px;">
              <img src="${property.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=200&auto=format&fit=crop"}" style="width: 100%; height: 96px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
              <h4 style="font-weight: bold; margin-bottom: 4px; color: #0f172a;">${property.title}</h4>
              <p style="color: #6366f1; font-weight: bold; margin-bottom: 4px;">${property.currency} ${parseFloat(property.price).toLocaleString()}</p>
              <a href="/properties/${property.id}" style="font-size: 12px; color: #2563eb; font-weight: bold; text-decoration: underline; display: block;">View Details</a>
            </div>
          `;
          marker.bindPopup(popupContent);
        }
      });

      // Adjust view for single property
      if (properties.length === 1 && properties[0].latitude) {
        map.setView([properties[0].latitude, properties[0].longitude], 13);
      }
      
      // Fix for map not rendering correctly in containers
      setTimeout(() => {
        if (leafletMap.current) {
          leafletMap.current.invalidateSize();
        }
      }, 100);
    };

    initMap();

    return () => {
      isMounted = false;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [properties, center, zoom]);

  return (
    <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden shadow-glass border border-foreground/10 relative">
      <div ref={mapRef} className="h-full w-full z-0" />
      <style jsx global>{`
        .leaflet-container {
            background: #f8fafc !important;
            height: 100% !important;
            width: 100% !important;
        }
        .leaflet-popup-content-wrapper {
            border-radius: 1rem;
            padding: 0;
            overflow: hidden;
        }
        .leaflet-popup-content {
            margin: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default PropertyMap;
