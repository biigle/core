<div class="col-sm-6 col-lg-4">
    <div class="panel panel-default">
        <div class="panel-heading">
            <h3 class="panel-title">EXIF</h3>
        </div>
        @if ($transect->isRemote())
            <div class="panel-body text-muted">
                EXIF data is not available for images of remote transects.
            </div>
        @else
            <div class="table-responsive">
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
        @endif
    </div>
</div>
