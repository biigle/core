<div class="col-sm-6 col-lg-4">
    <div class="panel panel-default">
        <div class="panel-heading">
            <h3 class="panel-title">Meta info</h3>
        </div>
        <table class="table">
            <tr>
                <th>Transect</th>
                <td>{{ $image->transect->name }}</td>
            </tr>
            <tr>
                <th>Filename</th>
                <td>{{ $image->filename }}</td>
            </tr>
            <tr>
                <th>Dimensions</th>
                <td>{{ $image->width }} &times; {{ $image->height }} px</td>
            </tr>
            @if (is_array($image->exif) && array_key_exists('FileSize', $image->exif))
                <tr>
                    <th>Size</th>
                    <td>{{ round($image->exif['FileSize'] / 1e6, 2) }} MByte</td>
                </tr>
            @endif
        </table>
    </div>
</div>
