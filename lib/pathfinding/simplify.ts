/**
 * simplify.ts
 *
 * Douglas-Peucker path simplification algorithm.
 * Reduces the number of points in a polyline while preserving shape.
 */

/**
 * Calculate perpendicular distance from a point to a line segment.
 */
function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];

  // If line segment is a point, return distance to that point
  const lineLenSq = dx * dx + dy * dy;
  if (lineLenSq === 0) {
    const px = point[0] - lineStart[0];
    const py = point[1] - lineStart[1];
    return Math.sqrt(px * px + py * py);
  }

  // Perpendicular distance using cross product
  const num = Math.abs(
    dy * point[0] - dx * point[1] + lineEnd[0] * lineStart[1] - lineEnd[1] * lineStart[0]
  );
  return num / Math.sqrt(lineLenSq);
}

/**
 * Simplify a polyline using the Douglas-Peucker algorithm.
 *
 * @param points - Array of [x, y] coordinates
 * @param epsilon - Maximum distance threshold. Points within this distance
 *                  of the simplified line are removed.
 * @returns Simplified array of [x, y] coordinates
 */
export function simplifyPath(
  points: [number, number][],
  epsilon: number
): [number, number][] {
  if (points.length <= 2) {
    return [...points];
  }

  // Find the point with the maximum distance from the line
  let maxDist = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1]
    );
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance exceeds epsilon, recursively simplify
  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPath(points.slice(maxIndex), epsilon);
    // Merge, removing duplicate point at maxIndex
    return [...left.slice(0, -1), ...right];
  }

  // All points within epsilon -- return just endpoints
  return [points[0], points[points.length - 1]];
}
