<li role="presentation" @if($type === 'images') class="active"@endif>
    <a href="{{route('search', ['q' => $query, 't' => 'images'])}}">Images <span class="badge">@if($fileQueryTooShort)-@elseif($imageResultCountCapped){{readable_number($imageResultCount)}}+@else{{readable_number($imageResultCount)}}@endif</span></a>
</li>
