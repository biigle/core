<li role="presentation" @if(!$type || $type === 'projects') class="active"@endif>
    <a href="{{route('search', ['q' => $query, 't' => 'projects'])}}">Projects <span class="badge">{{readable_number($projectResultCount)}}@if($projectResultCountCapped)+@endif</span></a>
</li>
