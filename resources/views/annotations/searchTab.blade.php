<li role="presentation" @if($type === 'images') class="active"@endif>
    <a href="{{route('search', ['q' => $query, 't' => 'images'])}}">Images <span class="badge">{{readable_number($imageResultCount)}}</span></a>
</li>
