"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet 기본 아이콘 수정 (Next.js에서 필요)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// 위험 레벨에 따른 마커 색상
const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case "critical":
      return "#ef4444"; // red
    case "high":
      return "#f97316"; // orange
    case "medium":
      return "#eab308"; // yellow
    case "low":
    default:
      return "#22c55e"; // green
  }
};

// 커스텀 마커 아이콘 생성
const createCustomIcon = (riskLevel: string) => {
  const color = getRiskColor(riskLevel);

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// 지도 중심 이동 컴포넌트
function MapUpdater({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

interface IPMapProps {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  ip?: string;
  riskLevel?: string;
  isVPN?: boolean;
  isProxy?: boolean;
  isTor?: boolean;
  className?: string;
}

export default function IPMap({
  latitude,
  longitude,
  city = "Unknown",
  country = "Unknown",
  ip = "",
  riskLevel = "low",
  isVPN = false,
  isProxy = false,
  isTor = false,
  className = "",
}: IPMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  // SSR 방지 - 클라이언트에서만 렌더링
  useEffect(() => {
    // 약간의 지연을 두어 DOM이 확실히 준비되도록 함
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);

    return () => {
      clearTimeout(timer);
      setIsMounted(false);
    };
  }, []);

  if (!isMounted) {
    return (
      <div
        className={`bg-slate-800 rounded-lg animate-pulse ${className}`}
        style={{ height: "100%" }}
      >
        <div className="flex items-center justify-center h-full text-slate-500">
          Loading map...
        </div>
      </div>
    );
  }

  // 유효하지 않은 좌표 처리
  if (!latitude || !longitude || (latitude === 0 && longitude === 0)) {
    return (
      <div
        className={`bg-slate-800 rounded-lg ${className}`}
        style={{ height: "100%" }}
      >
        <div className="flex items-center justify-center h-full text-slate-500">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-2 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-sm">Location unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  const position: [number, number] = [latitude, longitude];
  const customIcon = createCustomIcon(riskLevel);

  // 고유 키 생성 - 좌표가 바뀔 때마다 새로운 지도 인스턴스 생성
  const mapKey = `map-${latitude}-${longitude}`;

  // 위협 태그 생성
  const threats: string[] = [];
  if (isVPN) threats.push("VPN");
  if (isProxy) threats.push("Proxy");
  if (isTor) threats.push("Tor");

  return (
    <div
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height: "100%" }}
    >
      <style jsx global>{`
        .leaflet-control-attribution {
          font-size: 8px !important;
          padding: 1px 4px !important;
          background: rgba(255, 255, 255, 0.7) !important;
        }
        .leaflet-control-attribution a {
          color: #555 !important;
        }
      `}</style>
      <MapContainer
        key={mapKey}
        center={position}
        zoom={10}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={position} zoom={10} />
        <Marker position={position} icon={customIcon}>
          <Popup>
            <div className="text-sm">
              <div className="font-bold text-gray-900 mb-1">{ip}</div>
              <div className="text-gray-700">
                📍 {city}, {country}
              </div>
              <div className="text-gray-600 text-xs mt-1">
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </div>
              {threats.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {threats.map((threat) => (
                    <span
                      key={threat}
                      className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded"
                    >
                      {threat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
