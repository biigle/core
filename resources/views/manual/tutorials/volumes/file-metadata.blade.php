@extends('manual.base')

@section('manual-title') File metadata @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            Upload metadata to add information that can't be extracted from the files.
        </p>
        <p>
            BIIGLE supports metadata like the date and time of creation or the geo coordinates of a file. Every time a new image volume is created, BIIGLE attempts to automatically read the metadata from the EXIF information of JPEG files. This doesn't work for videos or if the images have another format than JPEG.
        </p>
        <p>
            In this case you can upload a metadata file. By default, BIIGLE supports a simple CSV file format for file metadata. More file formats supported by this instance may be found <a href="#additional-formats">below</a>.
        </p>
        <p>
            The CSV file should use <code>,</code> as delimiter, <code>&quot;</code> as enclosure and <code>\</code> as escape characters. Please note the additional explanation of <a href="#video-metadata">video metadata</a> below. The following columns are supported (multiple synonyms exist for some colums, including the standard proposed in <a href="#ref1">[1]</a>):
        </p>
        <table class="table">
            <thead>
                <tr>
                    <th>Column</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <code>filename</code><br>
                        <code>file</code>
                    </td>
                    <td>
                        <p>
                            The name of the file the metadata belongs to.
                        </p>
                        <div class="panel panel-info">
                            <div class="panel-body text-info">
                                This column is mandatory.
                            </div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>taken_at</code><br>
                        <code>SUB_datetime</code>
                    </td>
                    <td>
                        The date and time where the file was taken. Example: 2016-12-19&nbsp;12:49:00
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>lng</code><br>
                        <code>lon</code><br>
                        <code>longitude</code><br>
                        <code>SUB_longitude</code>
                    </td>
                    <td>
                        Longitude where the file was taken in decimal form. If this column is present, <code>lat</code> must be present, too. Should be in the <a href="https://epsg.io/4326">EPSG:4326</a> coordinate reference system. Example: 52.3211
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>lat</code><br>
                        <code>latitude</code><br>
                        <code>SUB_latitude</code>
                    </td>
                    <td>
                        Latitude where the file was taken in decimal form. If this column is present, <code>lng</code> must be present, too. Should be in the <a href="https://epsg.io/4326">EPSG:4326</a> coordinate reference system. Example: 28.775
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>gps_altitude</code><br>
                        <code>SUB_altitude</code>
                    </td>
                    <td>
                        Altitude where the file was taken in meters. Negative for below sea level.
                        Example: -1500.5
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>distance_to_ground</code><br>
                        <code>SUB_distance</code>
                    </td>
                    <td>
                        Distance to the sea floor in meters.
                        Example: 30.25
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>area</code>
                    </td>
                    <td>
                        Area shown by the file in square meters.
                        Example: 2.6
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>yaw</code><br>
                        <code>SUB_heading</code>
                    </td>
                    <td>
                        The yaw/heading in degrees of the underwater vehicle. 0° yaw should be north, 90° east.
                        Example: 180
                    </td>
                </tr>
            </tbody>
        </table>
        <p>
            Example:
        </p>
<pre>
filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area
image_1.png,2016-12-19 17:09:00,52.112,28.001,-1500.5,30.25,2.6
image_2.png,2016-12-19 17:09:31,52.215,28.501,-1502.5,28.25,2.1
</pre>
        <p>
            The metadata CSV file can be uploaded when a new volume is created. For existing volumes, metadata can be uploaded by volume admins on the volume edit page that you can reach with the <button class="btn btn-default btn-xs"><span class="fa fa-pencil-alt" aria-hidden="true"></span></button> button of the volume overview. This will replace any previously imported metadata.
        </p>
    </div>
    <div class="row">
        <h3><a name="video-metadata"></a>Video metadata</h3>
        <p>
            Video metadata can be imported either in the "basic" or the "timestamped" form. The basic form is equivalent to image metadata where a video file can have at most one entry in the metadata CSV file. The timestamped form requires the <code>taken_at</code> column and allows to import many metadata values for different times of the same video. To import timestamped video metadata, add multiple rows with the same filename but different <code>taken_at</code> timestamp to the metadata CSV. Metadata will be ordered by timestamp and the earliest timestamp will be assumed to mark the beginning of the video.
        </p>
        <p>
            Example:
        </p>
        <pre>
filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area
video_1.mp4,2016-12-19 17:09:00,52.112,28.001,-1500.5,30.25,2.6
video_1.mp4,2016-12-19 17:10:00,52.122,28.011,-1505.5,25.0,5.5
</pre>
    </div>
    <div class="row">
        <h3><a name="additional-formats"></a>Additional metadata file formats</h3>
        @if (empty(app('modules')->getViewMixins('metadataParsers')))
            <p class="text-muted">
                No additional file formats are supported.
            </p>
        @else
            <ul>
                @mixin('metadataParsers')
            </ul>
        @endif
    </div>
    <div class="row">
        <h3>References</h3>
        <ol>
            <li><a name="ref1"></a> Schoening, T. et al. An acquisition, curation and management workflow for sustainable, terabyte-scale marine image analysis. Sci. Data 5:180181 doi: 10.1038/sdata.2018.181 (2018). doi: <a href="https://doi.org/10.1038/sdata.2018.181">10.1038/sdata.2018.181</a></li>
        </ol>
    </div>
@endsection
