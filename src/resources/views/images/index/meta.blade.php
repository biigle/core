<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">Image information</h3>
    </div>
    <div class="table-responsive">
        <table class="table">
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
</div>
