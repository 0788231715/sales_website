"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon initialization
const getIcon = () => {
  return L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
};

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
        map.setView([lat, lng], 13);
    }
  }, [lat, lng, map]);
  return null;
};

interface PropertyMapProps {
  properties: any[];
  center?: [number, number];
  zoom?: number;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ properties, center = [ -1.9441, 30.0619 ], zoom = 13 }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [mapIcon, setMapIcon] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    setMapIcon(getIcon());
  }, []);

  if (!isMounted) return <div className="w-full h-full min-h-[400px] bg-foreground/5 animate-pulse rounded-3xl" />;

  return (
    <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden shadow-glass border border-foreground/10 relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map((property) => (
          property.latitude && property.longitude && mapIcon && (
            <Marker key={property.id} position={[property.latitude, property.longitude]} icon={mapIcon}>
              <Popup className="custom-popup">
                <div className="p-2 min-w-[200px]">
                  <img src={property.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=200&auto=format&fit=crop"} alt={property.title} className="w-full h-24 object-cover rounded-lg mb-2" />
                  <h4 className="font-bold font-serif text-slate-900">{property.title}</h4>
                  <p className="text-accent font-bold">{property.currency} {parseFloat(property.price).toLocaleString()}</p>
                  <a href={`/properties/${property.id}`} className="text-xs text-blue-600 font-bold underline mt-1 block">View Details</a>
                </div>
              </Popup>
            </Marker>
          )
        ))}
        {properties.length === 1 && properties[0].latitude && (
          <RecenterMap lat={properties[0].latitude} lng={properties[0].longitude} />
        )}
      </MapContainer>

      <style jsx global>{`
        .leaflet-container {
            background: #f8fafc !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
            border-radius: 1rem;
            padding: 0;
            overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
            margin: 0;
        }
      `}</style>
    </div>
  );
};

export default PropertyMap;
