import Point from '@biigle/ol/geom/Point';
import Polygon from '@biigle/ol/geom/Polygon';
import MultiPolygon from '@biigle/ol/geom/MultiPolygon';
import MultiPoint from '@biigle/ol/geom/MultiPoint';
import LinearRing from '@biigle/ol/geom/LinearRing';
import LineString from '@biigle/ol/geom/LineString';
import MultiLineString from '@biigle/ol/geom/MultiLineString';
import JstsPolygon from 'jsts/org/locationtech/jts/geom/Polygon';
import JstsLinearRing from 'jsts/org/locationtech/jts/geom/LinearRing';
import OL3Parser from 'jsts/org/locationtech/jts/io/OL3Parser';
import Polygonizer from 'jsts/org/locationtech/jts/operation/polygonize/Polygonizer';
import Monkey from 'jsts/org/locationtech/jts/monkey';

class PolygonValidator {

    constructor(polygon) {
        this.polygon = polygon;
    }

    isInvalidPolygon() {
        let geometry = this.polygon.getGeometry();
        let points = geometry.getCoordinates()[0];
        return (new Set(points.map(xy => String([xy])))).size < 3;

    }

    getValidPolygon() {
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

        // translate ol geometry into jsts geometry
        let jstsGeom = parser.read(this.polygon.getGeometry());
        // divide possibly intersecting polygon at cross points 
        // in several smaller polygons
        let possiblyMultiGeom = parser.write(this.jstsValidate(jstsGeom));

        if (possiblyMultiGeom.getCoordinates().length > 1) {
            // select biggest part
            let biggestPolygonCoordinates = this.getGreatestPolygonCoordinates(possiblyMultiGeom);
            this.polygon.getGeometry().setCoordinates(biggestPolygonCoordinates);
            return this.polygon;
        }

        return this.polygon;

       
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
    jstsValidate(geom) {
        if (geom instanceof JstsPolygon) {
            if (geom.isValid()) {
                geom.normalize(); // validate does not pick up rings in the wrong order - this will fix that
                return geom; // If the polygon is valid just return it
            }
            var polygonizer = new Polygonizer();
            this.jstsAddPolygon(geom, polygonizer);
            return this.jstsToPolygonGeometry(polygonizer.getPolygons(), geom.getFactory());
        } else {
            return geom; // In my case, I only care about polygon / multipolygon geometries
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
    jstsAddPolygon(polygon, polygonizer) {
        this.jstsAddLineString(polygon.getExteriorRing(), polygonizer);

        for (var n = polygon.getNumInteriorRing(); n > 0; n--) {
            this.jstsAddLineString(polygon.getInteriorRingN(n), polygonizer);
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
    jstsAddLineString(lineString, polygonizer) {

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
    * @author Martin Kirk
    * 
    * @link https://stackoverflow.com/questions/36118883/using-jsts-buffer-to-identify-a-self-intersecting-polygon 
    * Get a geometry from a collection of polygons.
    *
    * @param polygons collection
    * @return null if there were no polygons, the polygon if there was only one, or a MultiPolygon containing all polygons otherwise
    */
    jstsToPolygonGeometry(polygons) {
        switch (polygons.size()) {
            case 0:
                return null; // No valid polygons!
            case 1:
                return polygons.iterator().next(); // single polygon - no need to wrap
            default:
                //polygons may still overlap! Need to sym difference them
                var iter = polygons.iterator();
                var ret = iter.next();
                while (iter.hasNext()) {
                    let next = iter.next();
                    let symDiff = ret.symDifference(next);
                    let diff = ret.difference(next);
                    // ignore nested geometry parts
                    if(symDiff.getCoordinates().length !== diff.getCoordinates().length){
                        ret = symDiff;
                    }
                }
                return ret;
        }
    }

    getGreatestPolygonCoordinates(multGeom) {
        let coordinateLists = multGeom.getCoordinates();
        let tmpGeom = multGeom.clone();
        let areas = coordinateLists.map((l) => {
            tmpGeom.setCoordinates([l]);
            return tmpGeom.getArea();
        });
        let idx = areas.indexOf(Math.max(...areas));

        return coordinateLists[idx];
    }
}

export default PolygonValidator;