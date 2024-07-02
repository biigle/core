import turfDifference from '@turf/difference';
import {polygon as turfPolygon} from '@turf/helpers';
import Polygon from 'ol/geom/Polygon.js';
import {reducePrecision} from './simplify.js';

export function difference(first, second) {
  // Reduce the precision of the coordinates to avoid artifacts from the difference
  // operation. If the full precision is used, some coordinates that should be equal are
  // not considered equal and the difference operation returns a multipolygon where it
  // shouldn't.
  first.geometry.coordinates = reducePrecision(first.geometry.coordinates);
  second.geometry.coordinates = reducePrecision(second.geometry.coordinates);

  var differencePolygon = turfDifference(first, second);

  // Return the larger part if a polygon has been split by the difference operation.
  if (differencePolygon.geometry.type === 'MultiPolygon') {
      var maxArea = 0;
      var maxCoords;
      for (var i = 0; i < differencePolygon.geometry.coordinates.length; i++) {
          var area = (new Polygon(differencePolygon.geometry.coordinates[i])).getArea();
          if (area > maxArea) {
              maxArea = area;
              maxCoords = differencePolygon.geometry.coordinates[i];
          }
      }

      return maxCoords;
  }

  return differencePolygon.geometry.coordinates;
}
