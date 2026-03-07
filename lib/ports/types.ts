import type { GreatLakeName } from "@/lib/geo/types";

export interface Port {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lake: GreatLakeName;
  type: "city" | "marina" | "island" | "landmark";
  state?: string;
  country: "US" | "CA";
  description?: string;
}
