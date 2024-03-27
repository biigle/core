import 'jsts/org/locationtech/jts/monkey'; // This monkey patches jsts prototypes.
import GeometryCollection from '@biigle/ol/geom/GeometryCollection';
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
        MultiPolygon,
        GeometryCollection
    );

    // Use convertFromPolygon() instead of write() because:
    //   1. Only Polygons are possible here
    //   2. Some BIIGLE modules (e.g. magic-sam) import OpenLayers again and create
    //      geometry from there, so the "module Polygon" does not equal the "core Polygon"
    //      in the instanceof check of write().
    let jstsPolygon = parser.convertFromPolygon(feature.getGeometry());

    if (jstsPolygon.isSimple()) {
        return feature;
    }

    let simplePolygons = jstsSimplify(jstsPolygon);
    let greatestPolygon = getGreatestPolygon(simplePolygons);
    // Convert back to OL geometry.
    greatestPolygon = parser.write(greatestPolygon);
    feature.getGeometry().setCoordinates(greatestPolygon.getCoordinates());
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
function jstsSimplify(geom) {
    if (geom.isValid()) {
        geom.normalize(); // validate does not pick up rings in the wrong order - this will fix that
        return geom; // If the polygon is valid just return it
    }

    let polygonizer = new Polygonizer();
    jstsAddPolygon(geom, polygonizer);

    let polygons = polygonizer.getPolygons().array
        // Remove holes by using the exterior ring.
        .map(p => p.getExteriorRing())
        // Convert (exterior) LinearRing to Polygon.
        .map(r => geom.getFactory().createPolygon(r));

    return polygons;
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
