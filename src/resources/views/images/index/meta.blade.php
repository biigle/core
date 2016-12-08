<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">Meta info</h3>
    </div>
    <div class="table-responsive">
        <table class="table">
            <tr>
                <th>Transect</th>
                <td>
                    <a href="{{route('transect', $transect->id)}}">{{ $transect->name }}</a>
                </td>
            </tr>
            <tr>
                <th>Filename</th>
                <td>{{ $image->filename }}</td>
            </tr>
            <tr>
                <th>Dimensions</th>
                <td>{{ $image->width }} &times; {{ $image->height }} px</td>
            </tr>
            @if ($image->taken_at)
                <tr>
                    <th>Created</th>
                    <td>{{ $image->taken_at }}</td>
                </tr>
            @endif
        </table>
    </div>
</div>
