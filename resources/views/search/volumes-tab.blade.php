<li role="presentation" @if($type === 'volumes') class="active"@endif>
    <a href="{{route('search', ['q' => $query, 't' => 'volumes'])}}">Volumes <span class="badge">{{readable_number($volumeResultCount)}}@if($volumeResultCountCapped)+@endif</span></a>
</li>
