@extends('manual.base')

@section('manual-title') Image metadata @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            Upload image metadata to add information that can't be extracted from the images.
        </p>
        <p>
            BIIGLE supports image metadata like the date and time of creation or the geo coordinates of an image. Every time a new volume is created BIIGLE attempts to automatically read the metadata from the EXIF information of JPG files. This doesn't work if the images have another format than JPG, come from a <a href="{{route('manual-tutorials', ['volumes', 'remote-volumes'])}}">remote location</a> or simply don't have the metadata stored in their EXIF information.
        </p>
        <p>
            In this case you can upload an image metadata file. The file should be a CSV file with <code>,</code> as delimiter, <code>&quot;</code> as enclosure and <code>\</code> as escape characters. The following columns are supported:
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
                        <code>filename</code>
                    </td>
                    <td>
                        The filename of the image the metadata belongs to.
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>taken_at</code>
                    </td>
                    <td>
                        The date and time where the image was taken. Example: 2016-12-19&nbsp;12:49:00
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>lng</code>
                    </td>
                    <td>
                        Longitude where the image was taken in decimal form. If this column is present, <code>lat</code> must be present, too. Example: 52.3211
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>lat</code>
                    </td>
                    <td>
                        Latitude where the image was taken in decimal form. If this column is present, <code>lng</code> must be present, too. Example: 28.775
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>gps_altitude</code>
                    </td>
                    <td>
                        Altitude where the image was taken in meters. Negative for below sea level.
                        Example: -1500.5
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>distance_to_ground</code>
                    </td>
                    <td>
                        Distance to the sea floor in meters.
                        Example: 30.25
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="panel panel-info">
            <div class="panel-body text-info">
                The <code>filename</code> column must always be present.
            </div>
        </div>
        <p>
            Example:
        </p>
<pre>
filename,taken_at,lng,lat,gps_altitude,distance_to_ground
image_1.png,2016-12-19 17:09:00,52.112,28.001,-1500.5,30.25
image_2.png,2016-12-19 17:09:31,52.215,28.501,-1502.5,28.25
</pre>
        <p>
            The image metadata CSV file can be uploaded by volume admins on the volume edit page that you can reach with the <button class="btn btn-default btn-xs"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button> button of the volume overview.
        </p>
    </div>
@endsection
