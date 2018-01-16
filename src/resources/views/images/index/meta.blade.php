<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">Image information</h3>
    </div>
    <div class="table-responsive">
        <table class="table">
            @if ($image->width && $image->height)
                <tr>
                    <th>Dimensions</th>
                    <td>{{ $image->width }} &times; {{ $image->height }} px</td>
                </tr>
            @endif
            @if ($image->size)
                <tr>
                    <th>Size</th>
                    <td>{{ $image->size }} MByte</td>
                </tr>
            @endif
            @if ($image->taken_at)
                <tr>
                    <th>Created</th>
                    <td>{{ $image->taken_at }}</td>
                </tr>
            @endif
            @if (!$volume->isRemote())
                @foreach ($exif as $field => $value)
                    <tr>
                        <th>{{ $field }}</th>
                        <td>{{ $value }}</td>
                    </tr>
                @endforeach
            @endif
            @foreach ($metadata as $field => $value)
                <tr>
                    <th>{{ $metadataMap[$field] }}</th>
                    <td>{{ $value }}</td>
                </tr>
            @endforeach
        </table>
    </div>
</div>
