<li role="presentation" @if($type === 'videos') class="active"@endif>
    <a href="{{route('search', ['q' => $query, 't' => 'videos'])}}">Videos <span class="badge">{{readable_number($videoResultCount)}}</span></a>
</li>
