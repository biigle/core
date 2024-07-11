import turfDifference from '@turf/difference';
import Polygon from '@biigle/ol/geom/Polygon.js';
import {reducePrecision} from './simplify.js';

export function difference(first, second) {
  // Reduce the precision of the coordinates to avoid artifacts from the difference
  // operation. If the full precision is used, some coordinates that should be equal are
  // not considered equal and the difference operation returns a multipolygon where it
  // shouldn't.
  first.geometry.coordinates = reducePrecision(first.geometry.coordinates);
  second.geometry.coordinates = reducePrecision(second.geometry.coordinates);

  const differencePolygon = turfDifference(first, second);

  // This can happen if second entirely contains first, resulting in an empty polygon.
  if (differencePolygon === null) {
    return [];
  }

  // Return the larger part if a polygon has been split by the difference operation.
  if (differencePolygon.geometry.type === 'MultiPolygon') {
      let maxArea = 0;
      let maxCoords;
      let area;
      for (let i = 0; i < differencePolygon.geometry.coordinates.length; i++) {
          area = (new Polygon(differencePolygon.geometry.coordinates[i])).getArea();
          if (area > maxArea) {
              maxArea = area;
              maxCoords = differencePolygon.geometry.coordinates[i];
          }
      }

      return maxCoords;
  }

  // This can happen if second made a hole in first. We keep first in this case.
  if (differencePolygon.geometry.coordinates.length > 1) {
    return first.geometry.coordinates;
  }

  return differencePolygon.geometry.coordinates;
}
