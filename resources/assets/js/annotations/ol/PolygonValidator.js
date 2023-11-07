import 'jsts/org/locationtech/jts/monkey'; // This monkey patches jsts prototypes.
import JstsLinearRing from 'jsts/org/locationtech/jts/geom/LinearRing';
import JstsPolygon from 'jsts/org/locationtech/jts/geom/Polygon';
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
export function makePolygonSimple(feature) {
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

    // Divide non-simple polygon at cross points into several smaller polygons
    // and translate back to ol geometry
    let polygons = jstsValidate(jstsPolygon)['array'].map(p => parser.write(p));

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
    if (geom instanceof JstsPolygon) {
        if (geom.isValid()) {
            geom.normalize(); // validate does not pick up rings in the wrong order - this will fix that
            return geom; // If the polygon is valid just return it
        }
        var polygonizer = new Polygonizer();
        jstsAddPolygon(geom, polygonizer);

        return polygonizer.getPolygons();
    } else {
        return geom;
    }
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

    for (var n = polygon.getNumInteriorRing(); n > 0; n--) {
        jstsAddLineString(polygon.getInteriorRingN(n), polygonizer);
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
