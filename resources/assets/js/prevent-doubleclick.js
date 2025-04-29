/**
* Compute the Euclidean distance between two points.
*
* @param Object point1 - The first point with getCoordinates() method.
* @param Object point2 - The second point with getCoordinates() method.
* @returns number - The computed distance between the two points.
*/

const POINT_CLICK_COOLDOWN = 400;
const POINT_CLICK_DISTANCE = 5;

let computeDistance = function (point1, point2) {
    let p1 = point1.getCoordinates();
    let p2 = point2.getCoordinates();
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
};

export { computeDistance, POINT_CLICK_COOLDOWN, POINT_CLICK_DISTANCE };
