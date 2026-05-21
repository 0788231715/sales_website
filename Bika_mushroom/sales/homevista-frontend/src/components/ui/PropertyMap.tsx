"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
};

interface PropertyMapProps {
  properties: any[];
  center?: [number, number];
  zoom?: number;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ properties, center = [ -1.9441, 30.0619 ], zoom = 13 }) => {
  return (
    <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden shadow-glass border border-white/10">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map((property) => (
          property.latitude && property.longitude && (
            <Marker key={property.id} position={[property.latitude, property.longitude]} icon={icon}>
              <Popup>
                <div className="p-2">
                  <img src={property.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=200&auto=format&fit=crop"} alt={property.title} className="w-full h-24 object-cover rounded-lg mb-2" />
                  <h4 className="font-bold font-serif">{property.title}</h4>
                  <p className="text-accent font-bold">${parseFloat(property.price).toLocaleString()}</p>
                  <a href={`/properties/${property.id}`} className="text-xs text-blue-500 underline mt-1 block">View Details</a>
                </div>
              </Popup>
            </Marker>
          )
        ))}
        {properties.length === 1 && properties[0].latitude && (
          <RecenterMap lat={properties[0].latitude} lng={properties[0].longitude} />
        )}
      </MapContainer>
    </div>
  );
};

export default PropertyMap;
