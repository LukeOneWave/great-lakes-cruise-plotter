import type { GeoProjection } from "d3-geo";

interface City {
  name: string;
  lat: number;
  lng: number;
}

const CITIES: City[] = [
  { name: "Chicago", lat: 41.88, lng: -87.63 },
  { name: "Detroit", lat: 42.33, lng: -83.05 },
  { name: "Milwaukee", lat: 43.04, lng: -87.91 },
  { name: "Cleveland", lat: 41.5, lng: -81.69 },
  { name: "Toronto", lat: 43.65, lng: -79.38 },
  { name: "Buffalo", lat: 42.89, lng: -78.88 },
  { name: "Green Bay", lat: 44.51, lng: -88.02 },
  { name: "Duluth", lat: 46.79, lng: -92.1 },
  { name: "Thunder Bay", lat: 48.38, lng: -89.25 },
  { name: "Sault Ste. Marie", lat: 46.5, lng: -84.35 },
  { name: "Traverse City", lat: 44.76, lng: -85.62 },
  { name: "Erie", lat: 42.13, lng: -80.09 },
  { name: "Rochester", lat: 43.16, lng: -77.61 },
  { name: "Ottawa", lat: 45.42, lng: -75.7 },
];

interface CityLabelsProps {
  projection: GeoProjection;
}

export function CityLabels({ projection }: CityLabelsProps) {
  return (
    <g className="city-labels">
      {CITIES.map((city) => {
        const coords = projection([city.lng, city.lat]);
        if (!coords) return null;
        const [x, y] = coords;

        return (
          <g key={city.name}>
            <circle cx={x} cy={y} r={2} fill="#fff" opacity={0.9} />
            <text
              x={x + 5}
              y={y + 4}
              fill="#fff"
              fontSize={9}
              fontFamily="'Geist', sans-serif"
              fontWeight={600}
              paintOrder="stroke"
              stroke="#2a6db5"
              strokeWidth={2.5}
              strokeLinejoin="round"
              pointerEvents="none"
            >
              {city.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}
