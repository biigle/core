<li role="presentation" @if($type === 'videos') class="active"@endif>
    <a href="{{route('search', ['q' => $query, 't' => 'videos'])}}">Videos <span class="badge">@if($fileQueryTooShort)-@elseif($videoResultCountCapped){{readable_number($videoResultCount)}}+@else{{readable_number($videoResultCount)}}@endif</span></a>
</li>
