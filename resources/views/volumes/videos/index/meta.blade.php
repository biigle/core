<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">Video information</h3>
    </div>
    <div class="panel-body table-responsive">
        <table class="table">
            @if ($video->width && $video->height)
                <tr>
                    <th>Dimensions</th>
                    <td>{{ $video->width }} &times; {{ $video->height }} px </td>
                </tr>
            @endif
            @if ($video->size)
                <tr>
                    <th>Size</th>
                    <td>{{ round($video->size / 1E+6, 2) }} MBytes </td>
                </tr>
            @endif
            @if ($video->mimetype)
                <tr>
                    <th>MIME</th>
                    <td><code>{{ $video->mimetype }}</code></td>
                </tr>
            @endif
            @if ($video->taken_at)
                <tr>
                    <th>Created</th>
                    @if (is_array($video->taken_at))
                        @foreach ($video->taken_at as $value)
                            <td>{{ $value }}</td>
                        @endforeach
                    @else
                        <td>{{ $video->taken_at }}</td>
                    @endif
                </tr>
            @endif
            @foreach ($metadata as $key => $field)
                <tr>
                    <th>{{ $metadataMap[$key] }}</th>
                    @if (is_array($field))
                        @foreach ($field as $value)
                            <td>{{ $value }}</td>
                        @endforeach
                    @else
                        <td>{{ $value }}</td>
                    @endif
                </tr>
            @endforeach
        </table>
    </div>
</div>
