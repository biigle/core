@push('scripts')
   <script type="text/javascript">
        biigle.$declare('videos.times', {!! collect($video->taken_at) !!});
        biigle.$declare('videos.metadata', {!! collect($video->metadata) !!});
        biigle.$declare('videos.metadataMap', {!! collect($metadataMap) !!});
   </script>
@endpush

<div id="video-metadata-modal" class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">Video information</h3>
    </div>
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
            @if (is_array($video->taken_at))
                <metadata-modal v-bind:show-modal="showModal" v-bind:times="times" v-bind:items="items" v-bind:name="name" v-on:close-modal="hideMetadataModal"></metadata-modal>
                <tr>
                    <th>Created</th>
                    <td>
                        <button class="btn btn-default" type="button" title="Show full timestamps" v-on:click.prevent="showTimes()">Show values</button>
                    </td>
                </tr>
                @foreach ($metadata as $field => $value)
                    <tr>
                        <th>{{ $metadataMap[$field] }}</th>
                        @if (is_array($value))
                            <td>
                                <button class="btn btn-default" type="button" title="Show full metadata array" v-on:click.prevent="showMetadata({{ json_encode($field) }})">Show values</button>
                            </td>
                        @else
                            <td>{{ $value }}</td>
                        @endif
                    </tr>
                @endforeach
            @else
                <tr>
                    <th>Created</th>
                    <td>{{ $video->taken_at }}</td>
                </tr>
                @foreach ($metadata as $field => $value)
                    <tr>
                        <th>{{ $metadataMap[$field] }}</th>
                        <td>{{ $value }}</td>
                    </tr>
                @endforeach
            @endif
        @endif
    </table>
</div>
