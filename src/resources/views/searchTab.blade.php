<li role="presentation" @if($type === 'volumes') class="active"@endif>
    <a href="{{route('search', ['q' => $query, 't' => 'volumes'])}}">Volumes <span class="badge">{{$volumeResultCount}}</span></a>
</li>
