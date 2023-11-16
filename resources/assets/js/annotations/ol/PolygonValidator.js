import 'jsts/org/locationtech/jts/monkey'; // This monkey patches jsts prototypes.
import JstsLinearRing from 'jsts/org/locationtech/jts/geom/LinearRing';
import LinearRing from '@biigle/ol/geom/LinearRing';
import LineString from '@biigle/ol/geom/LineString';
import MultiLineString from '@biigle/ol/geom/MultiLineString';
import MultiPoint from '@biigle/ol/geom/MultiPoint';
import MultiPolygon from '@biigle/ol/geom/MultiPolygon';
import OL3Parser from 'jsts/org/locationtech/jts/io/OL3Parser';
import Point from '@biigle/ol/geom/Point';
import Polygon from '@biigle/ol/geom/Polygon';
import Polygonizer from 'jsts/org/locationtech/jts/operation/polygonize/Polygonizer';

/**
 * Checks if polygon consists of at least 3 unique points
 *
 * @param feature containing the polygon
 * @returns True if coordinates contains at least 3 unique points, otherwise false
 */
export function isInvalidPolygon(feature) {
    let polygon = feature.getGeometry();
    let points = polygon.getCoordinates()[0];

    return (new Set(points.map(xy => String([xy])))).size < 3;
}

/**
 * Makes non-simple polygon simple
 *
 * @param feature feature containing the (non-simple) polygon
 */
export function simplifyPolygon(feature) {
    if (feature.getGeometry().getType() !== 'Polygon') {
        throw new Error("Only polygon geometries are supported.");
    }

    // Check if polygon is self-intersecting
    const parser = new OL3Parser();
    parser.inject(
        Point,
        LineString,
        LinearRing,
        Polygon,
        MultiPoint,
        MultiLineString,
        MultiPolygon
    );

    // Translate ol geometry into jsts geometry
    let jstsPolygon = parser.read(feature.getGeometry());

    if (jstsPolygon.isSimple()) {
        return feature;
    }

    // Divide non-simple polygon at cross points into several smaller polygons,
    // translate back to ol geometry and remove dupliate coordinate sets (polish)
    let polygons = polishPolygons(jstsValidate(jstsPolygon).array.map(p => parser.write(p)));

    if (polygons.length > 1) {
        // Select biggest part
        let greatestPolygon = getGreatestPolygon(polygons);
        // Only change coordinates because object references are in use
        feature.getGeometry().setCoordinates(greatestPolygon.getCoordinates());
    }
}

/**
 * @author Martin Kirk
 *
 * @link https://stackoverflow.com/questions/36118883/using-jsts-buffer-to-identify-a-self-intersecting-polygon
 *
 *
 *  Get / create a valid version of the geometry given. If the geometry is a polygon or multi polygon, self intersections /
 * inconsistencies are fixed. Otherwise the geometry is returned.
 *
 * @param geom
 * @return a geometry
 */
function jstsValidate(geom) {
    if (geom.isValid()) {
        geom.normalize(); // validate does not pick up rings in the wrong order - this will fix that
        return geom; // If the polygon is valid just return it
    }
    var polygonizer = new Polygonizer();
    jstsAddPolygon(geom, polygonizer);

    return polygonizer.getPolygons();
}

/**
* @author Martin Kirk
* 
* @link https://stackoverflow.com/questions/36118883/using-jsts-buffer-to-identify-a-self-intersecting-polygon
* 
* Add all line strings from the polygon given to the polygonizer given
*
* @param polygon polygon from which to extract line strings
* @param polygonizer polygonizer
*/
function jstsAddPolygon(polygon, polygonizer) {
    jstsAddLineString(polygon.getExteriorRing(), polygonizer);

    // If only one interior ring exists, access ring directly.
    // Otherwise loop will cause out of bounds error
    if (polygon.getNumInteriorRing() === 1) {
        jstsAddLineString(polygon.getInteriorRingN(0), polygonizer);
    } else {
        for (var n = polygon.getNumInteriorRing(); n > 0; n--) {
            jstsAddLineString(polygon.getInteriorRingN(n), polygonizer);
        }
}
}

/**
* @author Martin Kirk
* 
* @link https://stackoverflow.com/questions/36118883/using-jsts-buffer-to-identify-a-self-intersecting-polygon 
* Add the linestring given to the polygonizer
*
* @param linestring line string
* @param polygonizer polygonizer
*/
function jstsAddLineString(lineString, polygonizer) {

    if (lineString instanceof JstsLinearRing) {
        // LinearRings are treated differently to line strings : we need a LineString NOT a LinearRing
        lineString = lineString.getFactory().createLineString(lineString.getCoordinateSequence());
    }

    // unioning the linestring with the point makes any self intersections explicit.
    var point = lineString.getFactory().createPoint(lineString.getCoordinateN(0));
    var toAdd = lineString.union(point); //geometry

    //Add result to polygonizer
    polygonizer.add(toAdd);
}

/**
 * Removes duplicated subpolygon's coordinate set which can be still included in some polygons.
 * These polygons need to be "cleaned up", otherwise polygons are still intersecting.
 * 
 * Example: 
 * pg1 = [ [[1,0],[1,1],[1,2]], [[1,3],[1,4]] ]
 * pg2 = [ [1,3],[1,4] ]
 * => 
 * pg1 = [ [[1,0],[1,1],[1,2]] ]
 * pg2 = [ [1,3],[1,4] ]
 *
 * @param polygons List of polygons
 * @returns List of polygons with unique coordinate sets
 *
 * **/
function polishPolygons(polygons) {
    // Filter all polygons that contain two or more coordinate lists
    let multipleCoordSetPolygon = polygons.filter(p => p.getCoordinates().length > 1);

    // If all coordinate sets ocurring once, return polygons
    if (multipleCoordSetPolygon.length === 0) {
        return polygons;
    }

    // For each polygon with more than one coordinate set, check if a coordinate set occurs several times
    multipleCoordSetPolygon.forEach(p => {
        let pCoords = p.getCoordinates();
        for (let i = 0; i < polygons.length; i++) {
            let otherP = polygons[i]
            if (p !== otherP) {
                // subCoords can contain only one coordinate list that is equal
                let subCoords = pCoords.filter(coords => areEqual(coords, otherP.getCoordinates()[0]));
                // If subpolygon's coordinates are duplicates, remove them
                if (subCoords.length > 0) {
                    pCoords.splice(pCoords.indexOf(subCoords[0]), 1);
                    p.setCoordinates(pCoords);
                }
            }
        }
    });

    return polygons;
}

/**
 * Check if two arrays have equal content
 * 
 * @param a1 first array
 * @param a2 second array
 * 
 * @returns True if arrays have equal content otherwise false 
 * 
 * **/
function areEqual(a1, a2) {
    let a1Strings = a1.map(xy => JSON.stringify(xy));
    let a2Strings = a2.map(xy => JSON.stringify(xy));
    return a1Strings.every(xy => a2Strings.includes(xy));
}

/**
 * Determine polygon with largest area
 * 
 * @param polygonList List of polygons
 * @returns Polygon
 * **/
function getGreatestPolygon(polygonList) {
    let areas = polygonList.map(p => p.getArea());
    let idx = areas.indexOf(Math.max(...areas));

    return polygonList[idx];
}
