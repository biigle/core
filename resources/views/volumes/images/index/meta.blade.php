<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">Image information</h3>
    </div>
    <table class="table">
        @if ($image->width && $image->height)
            <tr>
                <th>Dimensions</th>
                <td>{{ $image->width }} &times; {{ $image->height }} px </td>
            </tr>
        @endif
        @if ($image->size)
            <tr>
                <th>Size</th>
                <td>{{ round($image->size / 1E+6, 2) }} MBytes </td>
            </tr>
        @endif
        @if ($image->mimetype)
            <tr>
                <th>MIME</th>
                <td><code>{{ $image->mimetype }}</code></td>
            </tr>
        @endif
        @if ($image->taken_at)
            <tr>
                <th>Created</th>
                <td>{{ $image->taken_at }}</td>
            </tr>
        @endif
        @foreach ($metadata as $field => $value)
            <tr>
                <th>{{ $metadataMap[$field] }}</th>
                <td>{{ $value }}</td>
            </tr>
        @endforeach
    </table>
</div>
