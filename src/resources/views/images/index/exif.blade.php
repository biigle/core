<div class="col-sm-6 col-lg-4">
    <div class="panel panel-default">
        <div class="panel-heading">
            <h3 class="panel-title">EXIF</h3>
        </div>
        <table class="table">
            @forelse (array_only($image->exif, $exifKeys) as $field => $value)
                <tr>
                    <th>{{ $field }}</th>
                    <td>{{ $value }}</td>
                </tr>
            @empty
                <tr><td>No EXIF data</td></tr>
            @endforelse
        </table>
    </div>
</div>
