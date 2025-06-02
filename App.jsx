
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

export default function App() {
  const [gearboxType, setGearboxType] = useState("auto");
  const [inFreewheelZone, setInFreewheelZone] = useState(false);
  const [fuelSaved, setFuelSaved] = useState(0);
  const [position, setPosition] = useState([50.62925, 3.057256]);
  const [speed, setSpeed] = useState(0);

  const zones = {
    stop: [50.6285, 3.0585],
    roundabout: [50.6298, 3.056],
    slope: [50.6275, 3.0595]
  };

  const radius = 150;

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          setPosition([latitude, longitude]);
          setSpeed(speed ? (speed * 3.6).toFixed(1) : 0);

          const nearZone = Object.values(zones).some(
            ([lat, lon]) => getDistance(latitude, longitude, lat, lon) < radius
          );
          setInFreewheelZone(nearZone);
        },
        (err) => console.error("Géolocalisation échouée", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    if (inFreewheelZone) {
      const msg = new SpeechSynthesisUtterance(
        gearboxType === "auto"
          ? "Roue libre activée automatiquement."
          : "Suggestion : passez au point mort."
      );
      window.speechSynthesis.speak(msg);
      setFuelSaved((prev) => prev + 0.3);
    }
  }, [inFreewheelZone]);

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000;
  }

  const icon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  return (
    <div style={{ fontFamily: "Arial", padding: "1rem" }}>
      <h1>INERTIO - Assistant de conduite</h1>
      <p>Vitesse actuelle : {speed} km/h</p>
      <p>Économie estimée : {fuelSaved.toFixed(2)} L</p>
      <p>
        Statut :{" "}
        <strong>
          {inFreewheelZone
            ? gearboxType === "auto"
              ? "Roue libre activée"
              : "Suggéré : point mort"
            : "Conduite normale"}
        </strong>
      </p>
      <div style={{ height: "300px", marginTop: "1rem" }}>
        <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position} icon={icon}>
            <Popup>Vous êtes ici</Popup>
          </Marker>
          {Object.entries(zones).map(([name, coords], idx) => (
            <Circle key={idx} center={coords} radius={radius} pathOptions={{ color: "blue", fillOpacity: 0.2 }}>
              <Popup>Zone : {name}</Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
