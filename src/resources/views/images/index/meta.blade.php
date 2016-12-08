<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">Image information</h3>
    </div>
    <div class="table-responsive">
        <table class="table">
            <tr>
                <th>Dimensions</th>
                <td>{{ $image->width }} &times; {{ $image->height }} px</td>
            </tr>
            <tr>
                <th>Size</th>
                <td>{{ round(File::size($image->url) / 1e4) / 1e2 }} MByte</td>
            </tr>
            @if ($image->taken_at)
                <tr>
                    <th>Created</th>
                    <td>{{ $image->taken_at }}</td>
                </tr>
            @endif
            @if (!$transect->isRemote())
                @foreach (array_only($image->exif, $exifKeys) as $field => $value)
                    <tr>
                        <th>{{ $field }}</th>
                        <td>{{ $value }}</td>
                    </tr>
                @endforeach
            @endif
        </table>
    </div>
</div>
