import type { Port } from "@/lib/ports/types";
import type { GreatLakeName } from "@/lib/geo/types";
import portsData from "@/lib/ports/ports.json";

const ports: Port[] = portsData as Port[];

export function getAllPorts(): Port[] {
  return [...ports];
}

export function searchPorts(query: string): Port[] {
  if (!query || query.trim() === "") {
    return [];
  }
  const q = query.toLowerCase();
  return ports.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.lake.toLowerCase().includes(q)
  );
}

export function getPortsByLake(lake: GreatLakeName): Port[] {
  return ports.filter((p) => p.lake === lake);
}

export function getPortById(id: string): Port | undefined {
  return ports.find((p) => p.id === id);
}
