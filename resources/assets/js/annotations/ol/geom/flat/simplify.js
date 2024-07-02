/**
 * Reduce the coordinate precision with rounding.
 *
 * @param {Array} coordinates Polygon coordinates.
 *
 * @return {Array}
 */
export function reducePrecision(coordinates, decimals) {
  decimals = decimals ? Math.pow(10, decimals) : 1000;

  return coordinates.map(function (ring) {
    return ring.map(function (coordinate) {
      return coordinate.map(function (value) {
        return Math.round(value * decimals) / decimals;
      });
    });
  });
}
