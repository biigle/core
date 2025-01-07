@extends('manual.base')

@section('manual-title') Annotation location reports @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            A detailed description of the annotation position estimation of the annotation location report.
        </p>
        <p>
            The annotation location report contains estimated annotation positions on a world map. The report file format is newline delimited <a href="https://geojson.org/">GeoJSON</a> which can be imported in a GIS software such as <a href="https://www.qgis.org">QGIS</a>.
        </p>
        <p>
            The annotation location report requires several fields for image metadata to compute the estimated annotation positions. In addition, the positions are computed based on a number of assumptions which are described below.
        </p>

        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                The annotation positions are only an estimate and will likely not reflect the actual real-world positions!
            </div>
        </div>

        <h3><a name="required-metadata"></a>Required metadata</h3>

        <p>
            The annotation location report requires the following <a href="{{route('manual-tutorials', ['volumes', 'image-metadata'])}}">image metadata</a> fields. Images or volumes where this information is not available will be ignored for the report.
        </p>

        <ul>
            <li>latitude and longitude</li>
            <li>distance to ground</li>
            <li>yaw</li>
            <li>width and height<sup>1</sup></li>
        </ul>

        <p>
            <sup>1</sup>The image width and height is determined automatically by BIIGLE when a new volume is created. It may take a few minutes for all images to be processed.
        </p>

        <h3><a name="assumptions"></a>Assumptions</h3>

        <p>
            The estimated annotation positions are calculated based on the following assumptions. Please bear in mind that these assumptions are never 100% met in a real environment and therefore the annotation positions are just <em>estimates</em>.
        </p>

        <ol>
            <li>
                <strong>Image coordinates:</strong> The image latitude and longitude is assumed to specify the position of the image center.
            </li>
            <li>
                <strong>Camera opening angle:</strong> The camera opening angle is assumed to be 90°.
            </li>
            <li>
                <strong>Camera orientation:</strong> The camera is assumed to point straight down to the ground.
            </li>
            <li>
                <strong>Yaw:</strong> A yaw of 0° is assumed to point north, 90° to point east.
            </li>
            <li>
                <strong>Pixel shape:</strong> A pixel of the image is assumed to have a square shape.
            </li>
        </ol>

        <h3><a name="position-estimation"></a>Position estimation</h3>

        <p>
            The annotation position estimation is performed in multiple steps:
        </p>

        <ol>
            <li>
                <p>
                    The annotation position relative to the image center is calculated (annotation offset) and then rotated according to the yaw around the image center.
                </p>
            </li>
            <li>
                <p>
                    The annotation offset in pixels is transformed to the offset in meters. For this, the assumptions about the camera opening angle and orientation are used. If the opening angle is 90° and the camera points straight down, the width of the image content can be assumed to be twice the distance of the camera to the sea floor (as the camera viewport is a right-angled triangle). The image width in meters determines the width of a single pixel (which is assumed to be a square) in meters, which in turn is used to transform the annotation offset to meters.
                </p>
            </li>
            <li>
                <p>
                    The final annotation position on the world map is determined by shifting the image center latitude/longitude coordinates by the previously calculated offset of the annotation in meters. The coordinate shift is calculated using the following simplified flat earth calculation in pseudo code (<a href="https://gis.stackexchange.com/a/2980/50820">reference</a>):
                </p>
<pre>
// Position, decimal degrees.
lat
lon

// Offsets in meters (north, east).
dn
de

// Earth's radius, sphere.
R = 6378137

// Coordinate offsets in radians.
dLat = dn / R
dLon = de / (R * COS( PI * lat / 180 ))

// Offset position, decimal degrees.
latO = lat + dLat * 180 / PI
lonO = lon + dLon * 180 / PI
</pre>
                <p>
                    If the previously mentioned assumptions are met, the displacement error introduced by this calculation should be quite small, as the offset from the image center position should be very small as well.
                </p>
            </li>
        </ol>

        <h3><a name="filtering-in-qgis"></a>Filtering in QGIS</h3>

        <p>
            Filtering of an annotation location report is done in the same way than filtering of an <a href="{{route('manual-tutorials', ['reports', 'image-location-reports'])}}#filter-annotation-image-location-report">image annotation image location report</a>. However, the annotation location report contains a different and <a href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-location-report">fixed set of properties</a> for each annotation. The most important properties are probably "_label_name" and "_label_id", which allow you to filter the annotation positions based on the label that is attached to the annotation. For example, a query to show only positions of annotations that have the "Sponge" label attached may look like this:
        </p>
        <pre>"_label_name" = 'Sponge'</pre>
        <p>
            Please note the different use of <code>""</code> to enclose a field identifier and <code>''</code> to enclose a fixed string.
        </p>
    </div>
@endsection
