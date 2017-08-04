<li role="presentation" @if(!$type || $type === 'projects') class="active"@endif>
    <a href="{{route('search', ['q' => $query, 't' => 'projects'])}}">Projects <span class="badge">{{$projectResultCount}}</span></a>
</li>
