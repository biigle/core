import turfUnion from '@turf/union';
import {reducePrecision} from './simplify.js';

export function union(first, second) {
  // Reduce the precision of the coordinates to avoid artifacts from the union operation.
  // If the full precision is used, some coordinates that should be equal are not
  // considered equal and the union operation returns a multipolygon where it shouldn't.
  first.geometry.coordinates = reducePrecision(first.geometry.coordinates);
  second.geometry.coordinates = reducePrecision(second.geometry.coordinates);
  const unionPolygon = turfUnion(first, second);

  // This can hapen if first and second are disjoint. Take first in this case.
  if (unionPolygon.geometry.type === 'MultiPolygon') {
    return first.geometry.coordinates;
  }

  let coords = unionPolygon.geometry.coordinates;
  // This can happen if the polygon has holes. Take the outer ring in this case.
  if (coords.length > 1) {
    coords = [coords[0]];
  }

  return coords;
}
